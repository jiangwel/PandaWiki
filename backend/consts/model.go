package consts

type BaiZhiCloudDefaultModel string

const (
	BaiZhiCloudDefaultChatModel       BaiZhiCloudDefaultModel = "deepseek-v3.1"
	BaiZhiCloudDefaultEmbeddingModel  BaiZhiCloudDefaultModel = "bge-m3"
	BaiZhiCloudDefaultRerankModel     BaiZhiCloudDefaultModel = "bge-reranker-v2-m3"
	BaiZhiCloudDefaultAnalysisModel   BaiZhiCloudDefaultModel = "deepseek-v3.1"
	BaiZhiCloudDefaultAnalysisVLModel BaiZhiCloudDefaultModel = "qwen-vl-max-latest"
)

func GetBaiZhiDefaultModel(modelType string) string {
	switch modelType {
	case "chat":
		return string(BaiZhiCloudDefaultChatModel)
	case "embedding":
		return string(BaiZhiCloudDefaultEmbeddingModel)
	case "rerank":
		return string(BaiZhiCloudDefaultRerankModel)
	case "analysis":
		return string(BaiZhiCloudDefaultAnalysisModel)
	case "analysis-vl":
		return string(BaiZhiCloudDefaultAnalysisVLModel)
	default:
		return string(BaiZhiCloudDefaultChatModel)
	}
}

type ModelSettingMode string

const (
	ModelSettingModeManual ModelSettingMode = "manual"
	ModelSettingModeAuto   ModelSettingMode = "auto"
)
