import ErrorJSON from '@/assets/json/error.json';
import Card from '@/components/Card';
import { ModelProvider } from '@/constant/enums';
import {
  postApiV1ModelSwitchMode,
  putApiV1Model,
  getApiV1ModelModeSetting,
} from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import { addOpacityToColor } from '@/utils';
import { Icon, message } from '@ctzhian/ui';
import {
  Box,
  Button,
  Stack,
  Switch,
  Radio,
  RadioGroup,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import LottieIcon from '../../LottieIcon';
import { useState, useEffect, lazy, Suspense } from 'react';
import {
  convertLocalModelToUIModel,
  modelService,
} from '@/services/modelService';
import AutoModelConfig from './AutoModelConfig';
import ModelConfigHeader from './ModelConfigHeader';
import ManualModelConfig from './ManualModelConfig';

const ModelModal = lazy(() =>
  import('@ctzhian/modelkit').then(
    (mod: typeof import('@ctzhian/modelkit')) => ({ default: mod.ModelModal }),
  ),
);

interface ModelConfigProps {
  onCloseModal: () => void;
  chatModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  embeddingModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  rerankModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisVLModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  getModelList: () => void;
  autoSwitchToAutoMode?: boolean;
  hideDocumentationHint?: boolean;
}

const ModelConfig = (props: ModelConfigProps) => {
  const theme = useTheme();
  const {
    onCloseModal,
    chatModelData,
    embeddingModelData,
    rerankModelData,
    analysisModelData,
    analysisVLModelData,
    getModelList,
    autoSwitchToAutoMode = false,
    hideDocumentationHint = false,
  } = props;

  const [autoConfigMode, setAutoConfigMode] = useState(false);
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
  const [tempMode, setTempMode] = useState<'auto' | 'manual'>('manual');
  const [savedMode, setSavedMode] = useState<'auto' | 'manual'>('manual');
  const [isSaving, setIsSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<
    'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl'
  >('chat');
  const [openingAdd, setOpeningAdd] = useState<
    'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl' | null
  >(null);

  const handleOpenAdd = async (
    type: 'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl',
  ) => {
    try {
      setOpeningAdd(type);
      // 预加载 modal 代码分块，避免首次打开白屏
      await import('@ctzhian/modelkit');
      setAddType(type);
      setAddOpen(true);
    } finally {
      setOpeningAdd(null);
    }
  };

  // 组件挂载时，获取当前配置
  useEffect(() => {
    const fetchModeSetting = async () => {
      try {
        const setting = await getApiV1ModelModeSetting();
        if (setting) {
          const isAuto = setting.mode === 'auto';
          const mode = setting.mode as 'auto' | 'manual';
          setAutoConfigMode(isAuto);
          setTempMode(mode);
          setSavedMode(mode);
        }
      } catch (err) {
        console.error('获取模型配置失败:', err);
      }
    };
    fetchModeSetting();
  }, []);

  // 如果需要自动切换到自动配置模式
  useEffect(() => {
    const switchToAutoMode = async () => {
      if (autoSwitchToAutoMode && !hasAutoSwitched) {
        try {
          await postApiV1ModelSwitchMode({ mode: 'auto' });
          setAutoConfigMode(true);
          setHasAutoSwitched(true);
          getModelList();
        } catch (err) {
          console.error('切换到自动配置模式失败:', err);
        }
      }
    };
    switchToAutoMode();
  }, [autoSwitchToAutoMode, hasAutoSwitched, getModelList]);

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
        <AutoModelConfig
          onCloseModal={onCloseModal}
          getModelList={getModelList}
        />
      ) : (
        <ManualModelConfig
          chatModelData={chatModelData}
          embeddingModelData={embeddingModelData}
          rerankModelData={rerankModelData}
          analysisModelData={analysisModelData}
          analysisVLModelData={analysisVLModelData}
          hideDocumentationHint={hideDocumentationHint}
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

export default ModelConfig;
