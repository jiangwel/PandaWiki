package consts

type AutoModeDefaultModel string

const (
	AutoModeDefaultChatModel       AutoModeDefaultModel = "deepseek-v3.1"
	AutoModeDefaultEmbeddingModel  AutoModeDefaultModel = "bge-m3"
	AutoModeDefaultRerankModel     AutoModeDefaultModel = "bge-reranker-v2-m3"
	AutoModeDefaultAnalysisModel   AutoModeDefaultModel = "deepseek-v3.1"
	AutoModeDefaultAnalysisVLModel AutoModeDefaultModel = "qwen-vl-max-latest"
)

func GetAutoModeDefaultModel(modelType string) string {
	switch modelType {
	case "chat":
		return string(AutoModeDefaultChatModel)
	case "embedding":
		return string(AutoModeDefaultEmbeddingModel)
	case "rerank":
		return string(AutoModeDefaultRerankModel)
	case "analysis":
		return string(AutoModeDefaultAnalysisModel)
	case "analysis-vl":
		return string(AutoModeDefaultAnalysisVLModel)
	default:
		return string(AutoModeDefaultChatModel)
	}
}

type ModelSettingMode string

const (
	ModelSettingModeManual ModelSettingMode = "manual"
	ModelSettingModeAuto   ModelSettingMode = "auto"
)
