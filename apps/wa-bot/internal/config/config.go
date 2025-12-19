package config

import (
	"os"
)

type Config struct {
	AppPort      string
	DatabasePath string
	WhatsappSessionPath string
}

func LoadConfig() Config {
	return Config{
		AppPort:             GetEnv("APP_PORT", "3000"),
		DatabasePath:        GetEnv("DB_PATH", "./nfinvoice.db"),
		WhatsappSessionPath: GetEnv("WA_SESSION_PATH", "./sessions"),
	}
}

func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
