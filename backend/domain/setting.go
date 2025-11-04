package domain

import (
	"time"
)

const (
	SettingKeySystemPrompt = "system_prompt"
	SettingBlockWords      = "block_words"
	SettingModelMode       = "model_setting_mode"
)

// table: settings
type Setting struct {
	ID          int       `json:"id" gorm:"primary_key"`
	KBID        string    `json:"kb_id"`
	Key         string    `json:"key"`
	Value       []byte    `json:"value" gorm:"type:jsonb"` // JSON string
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
