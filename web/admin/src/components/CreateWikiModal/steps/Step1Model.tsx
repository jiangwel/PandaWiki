import React, {
  useImperativeHandle,
  Ref,
  useState,
  useEffect,
  lazy,
  Suspense,
} from 'react';
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ModelConfigHeader from '@/components/System/component/ModelConfigHeader';
import ManualModelConfig from '@/components/System/component/ManualModelConfig';
import { Icon, message } from '@ctzhian/ui';
import {
  getApiV1ModelModeSetting,
  postApiV1ModelSwitchMode,
  postApiV1ModelAutoMode,
} from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import {
  convertLocalModelToUIModel,
  modelService,
} from '@/services/modelService';

const ModelModal = lazy(() =>
  import('@ctzhian/modelkit').then(
    (mod: typeof import('@ctzhian/modelkit')) => ({ default: mod.ModelModal }),
  ),
);

interface Step1ModelProps {
  ref: Ref<{ onSubmit: () => Promise<void> }>;
  chatModelData?: GithubComChaitinPandaWikiDomainModelListItem | null;
  embeddingModelData?: GithubComChaitinPandaWikiDomainModelListItem | null;
  rerankModelData?: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisModelData?: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisVLModelData?: GithubComChaitinPandaWikiDomainModelListItem | null;
  getModelList?: () => void;
}

const Step1Model: React.FC<Step1ModelProps> = ({
  ref,
  chatModelData = null,
  embeddingModelData = null,
  rerankModelData = null,
  analysisModelData = null,
  analysisVLModelData = null,
  getModelList = () => {},
}) => {
  const [tempMode, setTempMode] = useState<'auto' | 'manual'>('manual');
  const [savedMode, setSavedMode] = useState<'auto' | 'manual'>('manual');
  const [isSaving, setIsSaving] = useState(false);
  const [autoConfigMode, setAutoConfigMode] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<
    'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl'
  >('chat');
  const [openingAdd, setOpeningAdd] = useState<
    'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl' | null
  >(null);

  // 自动配置模式的状态
  const [autoConfigApiKey, setAutoConfigApiKey] = useState('');
  const [selectedAutoChatModel, setSelectedAutoChatModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingAutoConfig, setIsSavingAutoConfig] = useState(false);

  // 默认百智云 Chat 模型列表
  const DEFAULT_BAIZHI_CLOUD_CHAT_MODELS: string[] = [
    'deepseek-v3.1',
    'deepseek-r1',
    'kimi-k2-0711-preview',
    'qwen-vl-max-latest',
    'glm-4.5',
  ];

  const modelList = DEFAULT_BAIZHI_CLOUD_CHAT_MODELS;

  // 组件挂载时,获取当前配置
  useEffect(() => {
    const fetchModeSetting = async () => {
      try {
        const setting = await getApiV1ModelModeSetting();
        if (setting) {
          const mode = setting.mode as 'auto' | 'manual';
          setAutoConfigMode(mode === 'auto');
          setTempMode(mode);
          setSavedMode(mode);
        }
      } catch (err) {
        console.error('获取模型配置失败:', err);
      }
    };
    fetchModeSetting();
  }, []);

  // 如果没有选中模型且有可用模型，默认选择第一个
  useEffect(() => {
    if (modelList.length && !selectedAutoChatModel) {
      setSelectedAutoChatModel(modelList[0]);
    }
  }, [modelList, selectedAutoChatModel]);

  const handleOpenAdd = async (
    type: 'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl',
  ) => {
    try {
      setOpeningAdd(type);
      // 预加载 modal 代码分块,避免首次打开白屏
      await import('@ctzhian/modelkit');
      setAddType(type);
      setAddOpen(true);
    } finally {
      setOpeningAdd(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await postApiV1ModelSwitchMode({
        mode: tempMode,
      });
      setSavedMode(tempMode);
      setAutoConfigMode(tempMode === 'auto');
      message.success(
        tempMode === 'auto' ? '已切换为自动配置模式' : '已切换为手动配置模式',
      );
      getModelList(); // 刷新模型列表
    } catch (err) {
      message.error('切换模式失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAutoConfig = async () => {
    if (!autoConfigApiKey.trim()) {
      message.warning('请填写 API Key');
      return;
    }
    try {
      setIsSavingAutoConfig(true);
      await postApiV1ModelAutoMode({
        APIKey: autoConfigApiKey.trim(),
        ChatModel: selectedAutoChatModel,
      });
      message.success('保存成功');
      getModelList(); // 刷新模型列表
    } catch (err) {
      message.error('保存失败');
    } finally {
      setIsSavingAutoConfig(false);
    }
  };

  const onSubmit = async () => {
    if (savedMode === 'auto') {
      if (!autoConfigApiKey.trim()) {
        message.warning('请填写 API Key');
        throw new Error('API Key is required');
      }
      try {
        await postApiV1ModelAutoMode({
          APIKey: autoConfigApiKey.trim(),
        });
        message.success('自动配置保存成功');
      } catch (err) {
        message.error('自动配置保存失败');
        throw err;
      }
    } else {
      if (
        !chatModelData ||
        !embeddingModelData ||
        !rerankModelData ||
        !analysisModelData
      ) {
        return Promise.reject(new Error('请配置必要的模型'));
      }
    }
    return Promise.resolve();
  };

  useImperativeHandle(ref, () => ({
    onSubmit,
  }));

  return (
    <Stack gap={2}>
      <ModelConfigHeader
        tempMode={tempMode}
        savedMode={savedMode}
        isSaving={isSaving}
        onModeChange={newMode => {
          setTempMode(newMode);
          // 立即切换显示的组件
          setAutoConfigMode(newMode === 'auto');
        }}
        onSave={handleSave}
      />
      {autoConfigMode ? (
        <Stack
          sx={{
            flex: 1,
            p: 2,
            overflow: 'hidden',
            overflowY: 'auto',
          }}
        >
          <Box>
            {/* 提示信息 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                mb: 2,
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(25, 118, 210, 0.2)',
              }}
            >
              <Icon
                type='icon-info-circle'
                sx={{
                  fontSize: 16,
                  color: 'primary.main',
                  flexShrink: 0,
                  mt: 0.2,
                }}
              />
              <Box
                sx={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: 'text.secondary',
                }}
              >
                通过 API Key 连接百智云提供平台后，PandaWiki
                会自动配置好系统所需的问答模型、向量模型、文档分析模型、文档分析模型。充分利用平台配置，无需逐个手动配置。
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                color: 'text.primary',
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 3,
                  height: 14,
                  bgcolor: 'primary.main',
                  borderRadius: '2px',
                  mr: 1,
                }}
              />
              API Key
            </Box>
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'flex-end'}
            >
              <Box
                component='a'
                href='https://model-square.app.baizhi.cloud/token'
                target='_blank'
                sx={{
                  color: 'primary.main',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Icon type='icon-key' sx={{ fontSize: 14 }} />
                获取百智云 API Key
              </Box>
            </Stack>
            <TextField
              fullWidth
              size='medium'
              type={showApiKey ? 'text' : 'password'}
              value={autoConfigApiKey}
              onChange={e => setAutoConfigApiKey(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      onClick={() => setShowApiKey(s => !s)}
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: '10px',
                  height: '52px',
                },
              }}
            />
          </Box>
        </Stack>
      ) : (
        <ManualModelConfig
          chatModelData={chatModelData}
          embeddingModelData={embeddingModelData}
          rerankModelData={rerankModelData}
          analysisModelData={analysisModelData}
          analysisVLModelData={analysisVLModelData}
          hideDocumentationHint={true}
          openingAdd={openingAdd}
          handleOpenAdd={handleOpenAdd}
          getModelList={getModelList}
        />
      )}
      {addOpen && (
        <Suspense fallback={null}>
          <ModelModal
            open={addOpen}
            model_type={addType}
            data={
              addType === 'chat'
                ? convertLocalModelToUIModel(chatModelData)
                : addType === 'embedding'
                  ? convertLocalModelToUIModel(embeddingModelData)
                  : addType === 'rerank'
                    ? convertLocalModelToUIModel(rerankModelData)
                    : addType === 'analysis'
                      ? convertLocalModelToUIModel(analysisModelData)
                      : addType === 'analysis-vl'
                        ? convertLocalModelToUIModel(analysisVLModelData)
                        : null
            }
            onClose={() => setAddOpen(false)}
            refresh={getModelList}
            modelService={modelService}
            language='zh-CN'
            messageComponent={message}
            is_close_model_remark={true}
          />
        </Suspense>
      )}
    </Stack>
  );
};

export default Step1Model;
