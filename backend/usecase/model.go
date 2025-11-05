package usecase

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cloudwego/eino/schema"
	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
)

type ModelUsecase struct {
	modelRepo         *pg.ModelRepository
	logger            *log.Logger
	config            *config.Config
	nodeRepo          *pg.NodeRepository
	ragRepo           *mq.RAGRepository
	ragStore          rag.RAGService
	kbRepo            *pg.KnowledgeBaseRepository
	systemSettingRepo *pg.SystemSettingRepo
}

func NewModelUsecase(modelRepo *pg.ModelRepository, nodeRepo *pg.NodeRepository, ragRepo *mq.RAGRepository, ragStore rag.RAGService, logger *log.Logger, config *config.Config, kbRepo *pg.KnowledgeBaseRepository, settingRepo *pg.SystemSettingRepo) *ModelUsecase {
	u := &ModelUsecase{
		modelRepo:         modelRepo,
		logger:            logger.WithModule("usecase.model"),
		config:            config,
		nodeRepo:          nodeRepo,
		ragRepo:           ragRepo,
		ragStore:          ragStore,
		kbRepo:            kbRepo,
		systemSettingRepo: settingRepo,
	}
	return u
}

func (u *ModelUsecase) Create(ctx context.Context, model *domain.Model) error {
	if err := u.modelRepo.Create(ctx, model); err != nil {
		return err
	}
	if model.Type == domain.ModelTypeEmbedding || model.Type == domain.ModelTypeRerank || model.Type == domain.ModelTypeAnalysis || model.Type == domain.ModelTypeAnalysisVL {
		if id, err := u.ragStore.AddModel(ctx, model); err != nil {
			return err
		} else {
			model.ID = id
		}
	}
	if model.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetList(ctx context.Context) ([]*domain.ModelListItem, error) {
	return u.modelRepo.GetList(ctx)
}

// trigger upsert records after embedding model is updated or created
func (u *ModelUsecase) TriggerUpsertRecords(ctx context.Context) error {
	// update to new dataset
	kbList, err := u.kbRepo.GetKnowledgeBaseList(ctx)
	if err != nil {
		return fmt.Errorf("get knowledge base list failed: %w", err)
	}
	for _, kb := range kbList {
		newDatasetID, err := u.ragStore.CreateKnowledgeBase(ctx)
		if err != nil {
			return fmt.Errorf("create new dataset failed: %w", err)
		}
		if err := u.ragStore.DeleteKnowledgeBase(ctx, kb.DatasetID); err != nil {
			return fmt.Errorf("delete old dataset failed: %w", err)
		}
		if err := u.kbRepo.UpdateDatasetID(ctx, kb.ID, newDatasetID); err != nil {
			return fmt.Errorf("update knowledge base dataset id failed: %w", err)
		}
	}
	// traverse all nodes
	err = u.nodeRepo.TraverseNodesByCursor(ctx, func(nodeRelease *domain.NodeRelease) error {
		// async upsert vector content via mq
		nodeContentVectorRequests := []*domain.NodeReleaseVectorRequest{
			{
				KBID:          nodeRelease.KBID,
				NodeReleaseID: nodeRelease.ID,
				Action:        "upsert",
			},
		}
		if err := u.ragRepo.AsyncUpdateNodeReleaseVector(ctx, nodeContentVectorRequests); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (u *ModelUsecase) Update(ctx context.Context, req *domain.UpdateModelReq) error {
	if err := u.modelRepo.Update(ctx, req); err != nil {
		return err
	}
	ragModelTypes := []domain.ModelType{
		domain.ModelTypeEmbedding,
		domain.ModelTypeRerank,
		domain.ModelTypeAnalysis,
		domain.ModelTypeAnalysisVL,
	}
	if lo.Contains(ragModelTypes, req.Type) {
		updateModel := &domain.Model{
			ID:       req.ID,
			Model:    req.Model,
			Type:     req.Type,
			BaseURL:  req.BaseURL,
			APIKey:   req.APIKey,
			IsActive: true,
		}
		if req.Parameters != nil {
			updateModel.Parameters = *req.Parameters
		}
		// update is active flag for analysis models
		if (req.Type == domain.ModelTypeAnalysis || req.Type == domain.ModelTypeAnalysisVL) && req.IsActive != nil {
			updateModel.IsActive = *req.IsActive
		}
		if err := u.ragStore.UpdateModel(ctx, updateModel); err != nil {
			return err
		}
	}
	// update all records when embedding model is updated
	if req.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetChatModel(ctx context.Context) (*domain.Model, error) {
	var model *domain.Model
	modelModeSetting, err := u.GetModelModeSetting(ctx)
	// 获取不到模型模式时，使用手动模式, 不返回错误
	if err != nil {
		u.logger.Error("get model mode setting failed, use manual mode", log.Error(err))
	}
	if err == nil && modelModeSetting.Mode == string(consts.ModelSettingModeAuto) {
		modelName := modelModeSetting.ChatModel
		if modelName == "" {
			modelName = string(consts.AutoModeDefaultChatModel)
		}
		model = &domain.Model{
			Model:    modelName,
			Type:     domain.ModelTypeChat,
			IsActive: true,
			BaseURL:  "https://model-square.app.baizhi.cloud/v1",
			APIKey:   modelModeSetting.AutoModeAPIKey,
			Provider: domain.ModelProviderBrandBaiZhiCloud,
		}
		return model, nil
	}
	model, err = u.modelRepo.GetChatModel(ctx)
	if err != nil {
		return nil, err
	}

	return model, nil
}

func (u *ModelUsecase) GetModelByType(ctx context.Context, modelType domain.ModelType) (*domain.Model, error) {
	return u.modelRepo.GetModelByType(ctx, modelType)
}

func (u *ModelUsecase) UpdateUsage(ctx context.Context, modelID string, usage *schema.TokenUsage) error {
	return u.modelRepo.UpdateUsage(ctx, modelID, usage)
}

func (u *ModelUsecase) SwitchMode(ctx context.Context, req *domain.SwitchModeReq) error {
	modelModeSetting, err := u.updateAutoModeSettingConfig(ctx, req.Mode, "", "")
	if err != nil {
		return err
	}


	if err := u.updateRAGModelsByMode(ctx, req.Mode, modelModeSetting.AutoModeAPIKey); err != nil {
		u.logger.Info("failed to update RAG models by mode", log.String("mode", req.Mode), log.Any("error", err))
	}

	return nil
}

// UpdateAutoModelSetting 更新百智云模型设置（API Key 与可选的 Chat 模型）
func (u *ModelUsecase) UpdateAutoModelSetting(ctx context.Context, req *domain.UpdateAutoModelSettingReq) error {
	// 更新并持久化自动模式配置
	if _, err := u.updateAutoModeSettingConfig(ctx, string(consts.ModelSettingModeAuto), req.APIKey, req.ChatModel); err != nil {
		return err
	}

	// 更新 RAG 模型，使用刚设置的自动模式与 API Key
	return u.updateRAGModelsByMode(ctx, string(consts.ModelSettingModeAuto), req.APIKey)
}

// updateAutoModeSettingConfig 读取当前设置并更新为自动模式，然后持久化
func (u *ModelUsecase) updateAutoModeSettingConfig(ctx context.Context, mode, apiKey, chatModel string) (*domain.ModelModeSetting, error) {
	// 读取当前设置
	setting, err := u.systemSettingRepo.GetModelModeSetting(ctx, domain.SystemSettingModelMode)
	if err != nil {
		return nil, fmt.Errorf("failed to get current model setting: %w", err)
	}

	var config domain.ModelModeSetting
	if err := json.Unmarshal(setting.Value, &config); err != nil {
		return nil, fmt.Errorf("failed to parse current model setting: %w", err)
	}

	// 更新设置
	config.AutoModeAPIKey = apiKey
	config.ChatModel = chatModel
	config.Mode = mode

	// 持久化设置
	updatedValue, err := json.Marshal(config)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated model setting: %w", err)
	}
	if err := u.systemSettingRepo.UpdateModelModeSetting(ctx, domain.SystemSettingModelMode, string(updatedValue)); err != nil {
		return nil, fmt.Errorf("failed to update model setting: %w", err)
	}
	return &config, nil
}

func (u *ModelUsecase) GetModelModeSetting(ctx context.Context) (domain.ModelModeSetting, error) {
	setting, err := u.systemSettingRepo.GetModelModeSetting(ctx, domain.SystemSettingModelMode)
	if err != nil {
		return domain.ModelModeSetting{}, fmt.Errorf("failed to get model mode setting: %w", err)
	}
	var config domain.ModelModeSetting
	if err := json.Unmarshal(setting.Value, &config); err != nil {
		return domain.ModelModeSetting{}, fmt.Errorf("failed to parse model mode setting: %w", err)
	}
	// 无效设置检查
	if config == (domain.ModelModeSetting{}) || config.Mode == "" || config.AutoModeAPIKey == "" {
		return domain.ModelModeSetting{}, fmt.Errorf("model mode setting is invalid")
	}
	return config, nil
}

// updateRAGModelsByMode 根据模式更新 RAG 模型（embedding、rerank、analysis、analysisVL）
func (u *ModelUsecase) updateRAGModelsByMode(ctx context.Context, mode string, autoModeAPIKey string) error {
	ragModelTypes := []domain.ModelType{
		domain.ModelTypeEmbedding,
		domain.ModelTypeRerank,
		domain.ModelTypeAnalysis,
		domain.ModelTypeAnalysisVL,
	}

	var hasEmbeddingModel bool
	for _, modelType := range ragModelTypes {
		var model *domain.Model

		if mode == string(consts.ModelSettingModeManual) {
			// 获取该类型的活跃模型
			m, err := u.modelRepo.GetModelByType(ctx, modelType)
			if err != nil {
				u.logger.Warn("failed to get model by type", log.String("type", string(modelType)), log.Any("error", err))
				continue
			}
			if m == nil || !m.IsActive {
				u.logger.Warn("no active model found for type", log.String("type", string(modelType)))
				continue
			}
			model = m
		} else {
			modelName := consts.GetAutoModeDefaultModel(string(modelType))
			model = &domain.Model{
				Model:    modelName,
				Type:     modelType,
				IsActive: true,
				BaseURL:  "https://model-square.app.baizhi.cloud/v1",
				APIKey:   autoModeAPIKey,
				Provider: domain.ModelProviderBrandBaiZhiCloud,
			}
		}

		// 更新RAG存储中的模型
		if model != nil {
			// rag store中更新失败不影响其他模型更新
			if err := u.ragStore.UpdateModel(ctx, model); err != nil {
				u.logger.Error("failed to update model in RAG store", log.String("model_id", model.ID), log.String("type", string(modelType)), log.Any("error", err))
				continue
			}
			u.logger.Info("successfully updated RAG model", log.String("model name: ", string(model.Model)))
		}

		// 检查是否有嵌入模型
		if modelType == domain.ModelTypeEmbedding {
			hasEmbeddingModel = true
		}
	}

	// 如果有嵌入模型，触发记录更新
	if hasEmbeddingModel {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}
