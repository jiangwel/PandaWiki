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

interface AutoModelConfigProps {
  /** 关闭模态框的回调 */
  onCloseModal: () => void;
  /** 刷新模型列表的回调 */
  getModelList: () => void;
}

const AutoModelConfig = (props: AutoModelConfigProps) => {
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
    <Card
      sx={{
        flex: 1,
        p: 2,
        overflow: 'hidden',
        overflowY: 'auto',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ mt: 2 }}>
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
          sx={{ mb: 1 }}
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
          type={showApiKey ? 'text' : 'password'}
          placeholder='sk – xxxxxxx'
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
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'error.main',
            },
            '& .MuiInputBase-root': {
              borderRadius: '10px',
            },
          }}
        />
      </Box>
      <Stack direction='row' justifyContent='flex-end' sx={{ mt: 2, mb: 3 }}>
        <Box sx={{ width: 420 }}>
          <Select
            fullWidth
            size='small'
            displayEmpty
            value={selectedAutoChatModel}
            onChange={e => setSelectedAutoChatModel(e.target.value as string)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiInputBase-root': {
                borderRadius: '10px',
                bgcolor: '#F8F8FA',
              },
            }}
            renderValue={sel =>
              sel && (sel as string).length ? (sel as string) : '请选择聊天模型'
            }
          >
            {modelList.map((model: string) => (
              <MenuItem key={model} value={model}>
                {model}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>
      <Stack direction='row' justifyContent='flex-end' sx={{ mt: 1 }}>
        <Button
          variant='outlined'
          onClick={onCloseModal}
          sx={{ mr: 1 }}
          disabled={isSaving}
        >
          取消
        </Button>
        <Button
          variant='contained'
          onClick={handleSaveAutoConfig}
          loading={isSaving}
        >
          保存
        </Button>
      </Stack>
    </Card>
  );
};

export default AutoModelConfig;
