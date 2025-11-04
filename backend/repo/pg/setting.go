package pg

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
	"gorm.io/gorm/clause"
)

type SettingRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewSettingRepository(db *pg.DB, logger *log.Logger) *SettingRepository {
	return &SettingRepository{
		db:     db,
		logger: logger.WithModule("pro.repo.pg.setting"),
	}
}

func (r *SettingRepository) CreateSetting(ctx context.Context, setting *domain.Setting) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "kb_id"}, {Name: "key"}},
		DoUpdates: clause.Assignments(map[string]any{"value": setting.Value, "description": setting.Description}),
	}).Create(setting).Error
}

func (r *SettingRepository) GetSetting(ctx context.Context, kbID, key string) (*domain.Setting, error) {
	var setting domain.Setting
	result := r.db.WithContext(ctx).Where("kb_id = ? AND key = ?", kbID, key).First(&setting)
	if result.Error != nil {
		return nil, result.Error
	}

	return &setting, nil
}

func (r *SettingRepository) UpdateSetting(ctx context.Context, kbID, key, value string) error {
	return r.db.WithContext(ctx).Model(&domain.Setting{}).Where("kb_id = ? AND key = ?", kbID, key).Update("value", value).Error
}
