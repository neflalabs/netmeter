package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	
	"whatsapp-bot/internal/handler"
	"whatsapp-bot/internal/service"
)

func main() {
	// Initialize Fiber App
	app := fiber.New(fiber.Config{
		AppName: "NeflaLabs Whatsapp Service",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Initialize Services
	// cfg := config.LoadConfig()
	waService := service.NewWhatsappService()
	waHandler := handler.NewWhatsappHandler(waService)

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "UP",
			"service": "whatsapp-bot",
		})
	})

	internalAuth := func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		expectedSecret := "INTERNAL_PSK_SECRET" // Default or from env
		// In a real scenario, use os.Getenv("INTERNAL_AUTH_TOKEN")
		if authHeader != "Bearer "+expectedSecret {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}
		return c.Next()
	}

	api := app.Group("/api", internalAuth)
	wa := api.Group("/whatsapp")
	
	wa.Get("/status", waHandler.Status)
	wa.Post("/login", waHandler.Login)
	wa.Post("/logout", waHandler.Logout)
	wa.Post("/send", waHandler.SendMessage)
	wa.Get("/message/:id/status", waHandler.GetMessageStatus)

	// Start Server
	log.Fatal(app.Listen(":3000"))
}
