package handler

import (
	"encoding/base64"
	
	"github.com/gofiber/fiber/v2"
	"github.com/skip2/go-qrcode"
	"whatsapp-bot/internal/service"
)

type WhatsappHandler struct {
	Service service.WhatsappService
}

func NewWhatsappHandler(s service.WhatsappService) *WhatsappHandler {
	return &WhatsappHandler{Service: s}
}

func (h *WhatsappHandler) Login(c *fiber.Ctx) error {
	qr, err := h.Service.Login()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": err.Error()})
	}

	// If already logged in/connected, just return status
	if qr == "ALREADY_LOGGED_IN" || qr == "ALREADY_CONNECTED" {
		return c.JSON(fiber.Map{
			"status": "CONNECTED",
		})
	}

	// Convert QR string to Image
	png, err := qrcode.Encode(qr, qrcode.Medium, 256)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Failed to generate QR image"})
	}

	qrBase64 := "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)

	return c.JSON(fiber.Map{
		"status": "SCANNING",
		"qr":     qrBase64,
	})
}

func (h *WhatsappHandler) Status(c *fiber.Ctx) error {
	status, jid, pushName := h.Service.GetStatus()
	response := fiber.Map{
		"status": status,
	}
	if jid != nil {
		response["user"] = fiber.Map{
			"id":   jid.User,
			"name": pushName,
		}
	}
	return c.JSON(response)
}

type SendMessageRequest struct {
	Phone   string `json:"phone"`
	Message string `json:"message"`
}

func (h *WhatsappHandler) SendMessage(c *fiber.Ctx) error {
	var req SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Invalid request body"})
	}

	msgID, err := h.Service.SendMessage(req.Phone, req.Message)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": err.Error()})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Message sent",
		"id":      msgID,
	})
}

func (h *WhatsappHandler) GetMessageStatus(c *fiber.Ctx) error {
    id := c.Params("id")
    status := h.Service.GetMessageStatus(id)
    return c.JSON(fiber.Map{
        "id": id,
        "status": status,
    })
}

func (h *WhatsappHandler) Logout(c *fiber.Ctx) error {
	err := h.Service.Logout()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": err.Error()})
	}
	return c.JSON(fiber.Map{
		"status": "success",
		"message": "Logged out",
	})
}
