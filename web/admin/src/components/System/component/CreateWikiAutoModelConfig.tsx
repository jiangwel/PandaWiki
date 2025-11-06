import Card from '@/components/Card';
import { postApiV1ModelAutoMode } from '@/request/Model';
import { Icon, message } from '@ctzhian/ui';
import {
  Box,
  Button,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState, useEffect } from 'react';

interface CreateWikiAutoModelConfigProps {
  /** 关闭模态框的回调 */
  onCloseModal: () => void;
  /** 刷新模型列表的回调 */
  getModelList: () => void;
}

const CreateWikiAutoModelConfig = (props: CreateWikiAutoModelConfigProps) => {
  const { onCloseModal, getModelList } = props;

  const [autoConfigApiKey, setAutoConfigApiKey] = useState('');
  const [selectedAutoChatModel, setSelectedAutoChatModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 默认百智云 Chat 模型列表
  const DEFAULT_BAIZHI_CLOUD_CHAT_MODELS: string[] = [
    'deepseek-v3.1',
    'deepseek-r1',
    'kimi-k2-0711-preview',
    'qwen-vl-max-latest',
    'glm-4.5',
  ];

  const modelList = DEFAULT_BAIZHI_CLOUD_CHAT_MODELS;

  // 如果没有选中模型且有可用模型，默认选择第一个
  useEffect(() => {
    if (modelList.length && !selectedAutoChatModel) {
      setSelectedAutoChatModel(modelList[0]);
    }
  }, [modelList, selectedAutoChatModel]);

  const handleSaveAutoConfig = async () => {
    if (!autoConfigApiKey.trim()) {
      message.warning('请填写 API Key');
      return;
    }
    try {
      setIsSaving(true);
      await postApiV1ModelAutoMode({
        APIKey: autoConfigApiKey.trim(),
        ChatModel: selectedAutoChatModel,
      });
      message.success('保存成功');
      getModelList(); // 刷新模型列表
      onCloseModal();
    } catch (err) {
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
                <IconButton size='small' onClick={() => setShowApiKey(s => !s)}>
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
  );
};

export default CreateWikiAutoModelConfig;
