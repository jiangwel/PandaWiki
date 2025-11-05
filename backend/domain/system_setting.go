package domain

import (
	"time"
)

const (
	SystemSettingModelMode = "model_setting_mode"
)

// table: settings
type SystemSetting struct {
	ID          int       `json:"id" gorm:"primary_key"`
	Key         string    `json:"key"`
	Value       []byte    `json:"value" gorm:"type:jsonb"` // JSON string
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
