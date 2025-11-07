package fns

import (
	"context"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/usecase"
)

type MigrationAddModelSettingMode struct {
	Name      string
	logger    *log.Logger
	kbUsecase *usecase.KnowledgeBaseUsecase
}

func NewMigrationAddModelSettingMode(logger *log.Logger, kbUsecase *usecase.KnowledgeBaseUsecase) *MigrationAddModelSettingMode {
	return &MigrationAddModelSettingMode{
		Name:      "0003_add_model_setting_mode",
		logger:    logger,
		kbUsecase: kbUsecase,
	}
}

func (m *MigrationAddModelSettingMode) Execute(tx *gorm.DB) error {
	ctx := context.Background()

	// 检查是否已存在该设置
	var existingSetting domain.SystemSetting
	err := tx.WithContext(ctx).Where("key = ?", domain.SystemSettingModelMode).First(&existingSetting).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to check existing model_setting_mode setting: %w", err)
	}

	// 如果记录不存在，则创建新记录
	if err == gorm.ErrRecordNotFound {
		// 老用户设置手动模型, 新用户设置自动模式
		mode := string(consts.ModelSettingModeManual)
		kbList, err := m.kbUsecase.GetKnowledgeBaseList(ctx)
		if err != nil {
			return fmt.Errorf("get kb list failed: %w", err)
		}
		if len(kbList) == 0 {
			mode = string(consts.ModelSettingModeAuto)
		}

		// 定义model_setting_mode的值结构
		modelSettingValue := map[string]interface{}{
			"mode":              mode,
			"auto_mode_api_key": "", // 默认没有api key
			"chat_model":        "", // 对话模型，默认为空
		}

		// 将值转换为JSON字节数组
		valueBytes, err := json.Marshal(modelSettingValue)
		if err != nil {
			return fmt.Errorf("failed to marshal model setting value: %w", err)
		}

		// 创建setting记录
		setting := &domain.SystemSetting{
			Key:         domain.SystemSettingModelMode,
			Value:       valueBytes,
			Description: "Model setting mode configuration",
		}
		if err := tx.WithContext(ctx).Create(setting).Error; err != nil {
			return fmt.Errorf("failed to create model_setting_mode setting: %w", err)
		}
		m.logger.Info("successfully created model_setting_mode setting")
	} else {
		m.logger.Info("model_setting_mode setting already exists, skipping creation")
	}

	return nil
}
