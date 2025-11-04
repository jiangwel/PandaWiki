package fns

import (
	"context"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
)

type MigrationAddModelSettingMode struct {
	Name   string
	logger *log.Logger
}

func NewMigrationAddModelSettingMode(logger *log.Logger) *MigrationAddModelSettingMode {
	return &MigrationAddModelSettingMode{
		Name:   "0003_add_model_setting_mode",
		logger: logger,
	}
}

func (m *MigrationAddModelSettingMode) Execute(tx *gorm.DB) error {
	ctx := context.Background()

	// 定义model_setting_mode的值结构
	modelSettingValue := map[string]interface{}{
		"mode":       "manual", // 默认为自定义模式
		"auto_mode_api_key":    "",       // 默认没有api key
		"chat_model": "",       // 对话模型，默认为空
	}

	// 将值转换为JSON字节数组
	valueBytes, err := json.Marshal(modelSettingValue)
	if err != nil {
		return fmt.Errorf("failed to marshal model setting value: %w", err)
	}

	// 创建setting记录
	setting := &domain.Setting{
		KBID:        "", // 空字符串表示全局设置
		Key:         "model_setting_mode",
		Value:       valueBytes,
		Description: "Model setting mode configuration",
	}

	// 检查是否已存在该设置
	var existingSetting domain.Setting
	err = tx.WithContext(ctx).Where("kb_id = ? AND key = ?", "", "model_setting_mode").First(&existingSetting).Error
	if err != nil {
		return fmt.Errorf("failed to check existing model_setting_mode setting: %w", err)
	}

	// 如果记录不存在，则创建新记录
	if err == gorm.ErrRecordNotFound {
		if err := tx.WithContext(ctx).Create(setting).Error; err != nil {
			return fmt.Errorf("failed to create model_setting_mode setting: %w", err)
		}
		m.logger.Info("successfully created model_setting_mode setting")
	} else {
		m.logger.Info("model_setting_mode setting already exists, skipping creation")
	}

	return nil
}
