package service

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
	waProto "go.mau.fi/whatsmeow/binary/proto"
)

type WhatsappService interface {
	Login() (string, error)
	Logout() error
	GetStatus() (string, *types.JID, string)
	SendMessage(phone string, message string) (string, error)
	GetMessageStatus(id string) string
}

type whatsappServiceImpl struct {
	client    *whatsmeow.Client
	container *sqlstore.Container
	ctx       context.Context
	msgDb     *sql.DB
}

func NewWhatsappService() WhatsappService {
	dbLog := waLog.Stdout("Database", "INFO", true)

	// Ensure data directory exists
	os.MkdirAll("./data", 0755)

	// Fix: sqlstore.New requires context as first argument
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:./data/whatsapp.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}

	// Fix: GetFirstDevice requires context
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}

	// Set device platform to "Mac OS" and SAVE it
	deviceStore.Platform = "Mac OS"
	err = deviceStore.Save(context.Background())
	if err != nil {
		// fmt.Println("Failed to save device store:", err)
	}

	clientLog := waLog.Stdout("Client", "INFO", true)
	// fmt.Println("Initializing Client with Platform:", deviceStore.Platform)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	// Initialize message tracking DB
	msgDb, err := sql.Open("sqlite3", "./data/messages.db")
	if err != nil {
		panic(err)
	}

	// Create messages table if not exists
	_, err = msgDb.Exec(`CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		status TEXT,
		updated_at DATETIME
	)`)
	if err != nil {
		panic(err)
	}

	s := &whatsappServiceImpl{
		client:    client,
		container: container,
		ctx:       context.Background(),
		msgDb:     msgDb,
	}

	client.AddEventHandler(s.eventHandler)

	if client.Store.ID != nil {
		// Already logged in
		err = client.Connect()
		if err != nil {
			// fmt.Println("Failed to connect:", err)
		}
	}

	return s
}

func (s *whatsappServiceImpl) eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		// fmt.Println("Received a message!", v.Message.GetConversation())
        // Auto-mark as read
        if s.client != nil {
             // Helper to mark read
             go func() {
                 // Fix: MarkRead signature updated in library
                 // func (c *Client) MarkRead(ctx context.Context, ids []string, timestamp time.Time, chat, sender types.JID, receiptType ...types.ReceiptType) error
                 err := s.client.MarkRead(context.Background(), []string{v.Info.ID}, time.Now(), v.Info.Chat, v.Info.Sender)
                 if err != nil {
                     // fmt.Println("Failed to mark read:", err)
                 } else {
                     // fmt.Println("Marked message as read:", v.Info.ID)
                 }
             }()
        }

	case *events.Connected:
		// fmt.Println("Connected to WhatsApp!")
	case *events.LoggedOut:
		// fmt.Println("Logged out!")
	case *events.Receipt:
		// Handle read receipts
		status := ""
		switch v.Type {
		case events.ReceiptTypeDelivered:
			status = "DELIVERED"
		case events.ReceiptTypeRead:
		    status = "READ"
		case events.ReceiptTypePlayed:
			status = "READ"
		}

		if status != "" {
			for _, msgID := range v.MessageIDs {
				// fmt.Printf("Message %s status update: %s\n", msgID, status)
				s.updateMessageStatus(msgID, status)
			}
		}
	}
}

func (s *whatsappServiceImpl) updateMessageStatus(id, status string) {
	if s.msgDb == nil {
		return
	}
	// Only update if status is "better" (e.g. don't go from READ to DELIVERED)
	// But simple update is fine for now
	_, err := s.msgDb.Exec("UPDATE messages SET status = ?, updated_at = ? WHERE id = ?", status, time.Now(), id)
	if err != nil {
		// fmt.Println("Failed to update message status:", err)
	}
}

func (s *whatsappServiceImpl) Login() (string, error) {
	if s.client.Store.ID != nil {
		return "ALREADY_LOGGED_IN", nil
	}

	if s.client.IsConnected() {
		return "ALREADY_CONNECTED", nil
	}

	qrChan, _ := s.client.GetQRChannel(context.Background())
	err := s.client.Connect()
	if err != nil {
		return "", err
	}

	for evt := range qrChan {
		if evt.Event == "code" {
			return evt.Code, nil
		} else {
			// fmt.Println("QR Event:", evt.Event)
		}
	}

	return "", fmt.Errorf("QR generation failed or timeout")
}

func (s *whatsappServiceImpl) Logout() error {
	return s.client.Logout(context.Background())
}

func (s *whatsappServiceImpl) GetStatus() (string, *types.JID, string) {
	if s.client.IsConnected() {
		if s.client.IsLoggedIn() {
			return "CONNECTED", s.client.Store.ID, s.client.Store.PushName
		}
		return "WAITING_FOR_LOGIN", nil, ""
	}
	// Even if disconnected, if we have ID stored, return it?
	// Usually disconnected means we might still be logged in (just network down)
	if s.client.Store.ID != nil {
		return "DISCONNECTED", s.client.Store.ID, s.client.Store.PushName
	}
	return "DISCONNECTED", nil, ""
}

func (s *whatsappServiceImpl) GetMessageStatus(id string) string {
	var status string
	err := s.msgDb.QueryRow("SELECT status FROM messages WHERE id = ?", id).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "UNKNOWN"
		}
		return "ERROR"
	}
	return status
}

func (s *whatsappServiceImpl) SendMessage(phone string, message string) (string, error) {
	// Sanitize phone number
	var cleanPhone string
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			cleanPhone += string(ch)
		}
	}

	if len(cleanPhone) > 2 && cleanPhone[0] == '0' && cleanPhone[1] == '8' {
		cleanPhone = "62" + cleanPhone[1:]
	} else if len(cleanPhone) > 1 && cleanPhone[0] == '8' {
		// Handle case where user inputs "812..." directly (common in ID)
		cleanPhone = "62" + cleanPhone
	}

	if len(cleanPhone) < 5 {
		return "", fmt.Errorf("phone number too short")
	}

	jid, err := types.ParseJID(cleanPhone + "@s.whatsapp.net")
	if err != nil {
		return "", fmt.Errorf("failed to parse JID: %v", err)
	}

	resp, err := s.client.SendMessage(context.Background(), jid, &waProto.Message{
		Conversation: proto.String(message),
	})

	if err != nil {
		return "", err
	}
	
	msgID := resp.ID
	
	// Save initial status
	_, err = s.msgDb.Exec("INSERT OR REPLACE INTO messages (id, status, updated_at) VALUES (?, ?, ?)", msgID, "SENT", time.Now())
	if err != nil {
		// fmt.Println("Failed to save message status:", err)
		// Don't fail the send, just log error
	}

	return msgID, nil
}

