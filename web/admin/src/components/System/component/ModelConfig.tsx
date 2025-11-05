import ErrorJSON from '@/assets/json/error.json';
import Card from '@/components/Card';
import { ModelProvider } from '@/constant/enums';
import {
  postApiV1ModelSwitchMode,
  putApiV1Model,
  postApiV1ModelAutoMode,
} from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import { addOpacityToColor } from '@/utils';
import { Icon, message } from '@ctzhian/ui';
import {
  Box,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LottieIcon from '../../LottieIcon';
import { useState, useEffect, lazy, Suspense } from 'react';
import {
  convertLocalModelToUIModel,
  modelService,
} from '@/services/modelService';

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
  } = props;

  const [autoConfigMode, setAutoConfigMode] = useState(false);
  const [autoConfigApiKey, setAutoConfigApiKey] = useState('');
  const [supportedModels, setSupportedModels] = useState<string[]>([]);
  const [selectedAutoChatModel, setSelectedAutoChatModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

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

  // 自动配置模式：前端定义百智云 Chat 模型列表
  const BAIZHI_CLOUD_CHAT_MODELS: string[] = [
    'deepseek-v3.1',
    'deepseek-r1',
    'kimi-k2-0711-preview',
    'qwen-vl-max-latest',
    'glm-4.5',
  ];

  // 自动配置模式：不依赖 API Key，始终展示前端定义的模型列表
  useEffect(() => {
    if (!autoConfigMode) {
      setSupportedModels([]);
      setSelectedAutoChatModel('');
      return;
    }
    const list: string[] = BAIZHI_CLOUD_CHAT_MODELS;
    setSupportedModels(list);
    if (list.length && !selectedAutoChatModel) {
      setSelectedAutoChatModel(list[0]);
    }
  }, [autoConfigMode]);

  const handleSaveAutoConfig = async () => {
    if (!autoConfigApiKey.trim()) {
      message.warning('请填写 API Key');
      return;
    }
    if (!selectedAutoChatModel) {
      message.warning('请选择聊天模型');
      return;
    }
    try {
      await postApiV1ModelAutoMode({
        APIKey: autoConfigApiKey.trim(),
        ChatModel: selectedAutoChatModel,
      });
      message.success('保存成功');
      onCloseModal();
    } catch (err) {
      message.error('保存失败');
    }
  };

  return (
    <Stack gap={2}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 2 }}>
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={autoConfigMode}
              onChange={async e => {
                const checked = e.target.checked;
                try {
                  await postApiV1ModelSwitchMode({
                    mode: checked ? 'auto' : 'manual',
                  });
                  setAutoConfigMode(checked);
                  message.success(
                    checked ? '已切换为自动配置模式' : '已切换为手动配置模式',
                  );
                } catch (err) {
                  message.error('切换模式失败');
                }
              }}
            />
          }
          label='自动配置模型'
        />
      </Box>
      {autoConfigMode ? (
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
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Icon type='icon-baizhiyunlogo' sx={{ fontSize: 18 }} />
            <Box sx={{ fontSize: 18, fontFamily: 'Gbold' }}>百智云</Box>
          </Stack>
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
            sx={{ mt: 2 }}
          >
            <Box sx={{ fontSize: 12 }}>
              API Key{' '}
              <Box component='span' sx={{ color: 'error.main' }}>
                *
              </Box>
            </Box>
            <Box
              component='a'
              href='https://model-square.app.baizhi.cloud/token'
              target='_blank'
              sx={{ color: 'primary.main', fontSize: 12 }}
            >
              获取百智云API Key
            </Box>
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <TextField
              fullWidth
              type={showApiKey ? 'text' : 'password'}
              placeholder=''
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
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '& .MuiInputBase-root': {
                  borderRadius: '10px',
                  bgcolor: '#F8F8FA',
                },
              }}
            />
          </Box>
          <Stack
            direction='row'
            justifyContent='flex-end'
            sx={{ mt: 2, mb: 3 }}
          >
            <Box sx={{ width: 420 }}>
              <Select
                fullWidth
                size='small'
                displayEmpty
                value={selectedAutoChatModel}
                onChange={e =>
                  setSelectedAutoChatModel(e.target.value as string)
                }
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
                  sel && (sel as string).length
                    ? (sel as string)
                    : '请选择聊天模型'
                }
              >
                {supportedModels.map(model => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>
          <Stack direction='row' justifyContent='flex-end' sx={{ mt: 1 }}>
            <Button variant='outlined' onClick={onCloseModal} sx={{ mr: 1 }}>
              取消
            </Button>
            <Button variant='contained' onClick={handleSaveAutoConfig}>
              保存
            </Button>
          </Stack>
        </Card>
      ) : (
        <>
          {/* Chat */}
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
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Box>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={1}
                  sx={{ width: 500 }}
                >
                  {chatModelData ? (
                    <>
                      <Icon
                        type={
                          ModelProvider[
                            chatModelData.provider as keyof typeof ModelProvider
                          ].icon
                        }
                        sx={{ fontSize: 18 }}
                      />
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'text.tertiary',
                        }}
                      >
                        {ModelProvider[
                          chatModelData.provider as keyof typeof ModelProvider
                        ].cn ||
                          ModelProvider[
                            chatModelData.provider as keyof typeof ModelProvider
                          ].label ||
                          '其他'}
                        &nbsp;&nbsp;/
                      </Box>
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          fontFamily: 'Gbold',
                          ml: -0.5,
                        }}
                      >
                        {chatModelData.model}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          px: 1,
                          lineHeight: '20px',
                          borderRadius: '10px',
                          bgcolor: addOpacityToColor(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          color: 'primary.main',
                        }}
                      >
                        智能对话模型
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        fontSize: 14,
                        lineHeight: '20px',
                        fontFamily: 'Gbold',
                        ml: -0.5,
                      }}
                    >
                      智能对话模型
                    </Box>
                  )}
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    大模型
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    必选
                  </Box>
                </Stack>
                <Box sx={{ fontSize: 12, color: 'text.tertiary', mt: 1 }}>
                  在
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能问答{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    摘要生成{' '}
                  </Box>
                  过程中使用。
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, flexSelf: 'flex-start' }}>
                {chatModelData ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.success.main,
                        0.1,
                      ),
                      color: 'success.main',
                    }}
                  >
                    状态正常
                  </Box>
                ) : (
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Box
                      sx={{
                        fontSize: 12,
                        px: 1,
                        lineHeight: '20px',
                        borderRadius: '10px',
                        bgcolor: addOpacityToColor(
                          theme.palette.error.main,
                          0.1,
                        ),
                        color: 'error.main',
                      }}
                    >
                      必填配置
                    </Box>
                    <Stack
                      alignItems={'center'}
                      justifyContent={'center'}
                      sx={{ width: 22, height: 22, cursor: 'pointer' }}
                    >
                      <LottieIcon
                        id='warning'
                        src={ErrorJSON}
                        style={{ width: 20, height: 20 }}
                      />
                    </Stack>
                    <Box sx={{ color: 'error.main', fontSize: 12 }}>
                      未配置无法使用，如果没有可用模型，可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </Stack>
                )}
              </Box>
              <Button
                size='small'
                variant='outlined'
                loading={openingAdd === 'chat'}
                onClick={() => handleOpenAdd('chat')}
              >
                {chatModelData ? '修改' : '配置'}
              </Button>
            </Stack>
          </Card>

          {/* Embedding */}
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
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Box>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={1}
                  sx={{ width: 500 }}
                >
                  {embeddingModelData ? (
                    <>
                      <Icon
                        type={
                          ModelProvider[
                            embeddingModelData.provider as keyof typeof ModelProvider
                          ].icon
                        }
                        sx={{ fontSize: 18 }}
                      />
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'text.tertiary',
                        }}
                      >
                        {ModelProvider[
                          embeddingModelData.provider as keyof typeof ModelProvider
                        ].cn ||
                          ModelProvider[
                            embeddingModelData.provider as keyof typeof ModelProvider
                          ].label ||
                          '其他'}
                        &nbsp;&nbsp;/
                      </Box>
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          fontFamily: 'Gbold',
                          ml: -0.5,
                        }}
                      >
                        {embeddingModelData.model}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          px: 1,
                          lineHeight: '20px',
                          borderRadius: '10px',
                          bgcolor: addOpacityToColor(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          color: 'primary.main',
                        }}
                      >
                        向量模型
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        fontSize: 14,
                        lineHeight: '20px',
                        fontFamily: 'Gbold',
                        ml: -0.5,
                      }}
                    >
                      向量模型
                    </Box>
                  )}
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    小模型
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    必选
                  </Box>
                </Stack>
                <Box sx={{ fontSize: 12, color: 'text.tertiary', mt: 1 }}>
                  在
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    内容发布{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能问答{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能搜索{' '}
                  </Box>
                  过程中使用。
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, flexSelf: 'flex-start' }}>
                {embeddingModelData ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.success.main,
                        0.1,
                      ),
                      color: 'success.main',
                    }}
                  >
                    状态正常
                  </Box>
                ) : (
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Box
                      sx={{
                        fontSize: 12,
                        px: 1,
                        lineHeight: '20px',
                        borderRadius: '10px',
                        bgcolor: addOpacityToColor(
                          theme.palette.error.main,
                          0.1,
                        ),
                        color: 'error.main',
                      }}
                    >
                      必填配置
                    </Box>
                    <Stack
                      alignItems={'center'}
                      justifyContent={'center'}
                      sx={{ width: 22, height: 22, cursor: 'pointer' }}
                    >
                      <LottieIcon
                        id='warning'
                        src={ErrorJSON}
                        style={{ width: 20, height: 20 }}
                      />
                    </Stack>
                    <Box sx={{ color: 'error.main', fontSize: 12 }}>
                      未配置无法使用，如果没有可用模型，可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </Stack>
                )}
              </Box>
              <Button
                size='small'
                variant='outlined'
                loading={openingAdd === 'embedding'}
                onClick={() => handleOpenAdd('embedding')}
              >
                {embeddingModelData ? '修改' : '配置'}
              </Button>
            </Stack>
          </Card>

          {/* Rerank */}
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
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Box>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={1}
                  sx={{ width: 500 }}
                >
                  {rerankModelData ? (
                    <>
                      <Icon
                        type={
                          ModelProvider[
                            rerankModelData.provider as keyof typeof ModelProvider
                          ].icon
                        }
                        sx={{ fontSize: 18 }}
                      />
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'text.tertiary',
                        }}
                      >
                        {ModelProvider[
                          rerankModelData.provider as keyof typeof ModelProvider
                        ].cn ||
                          ModelProvider[
                            rerankModelData.provider as keyof typeof ModelProvider
                          ].label ||
                          '其他'}
                        &nbsp;&nbsp;/
                      </Box>
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          fontFamily: 'Gbold',
                          ml: -0.5,
                        }}
                      >
                        {rerankModelData.model}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          px: 1,
                          lineHeight: '20px',
                          borderRadius: '10px',
                          bgcolor: addOpacityToColor(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          color: 'primary.main',
                        }}
                      >
                        重排序模型
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        fontSize: 14,
                        lineHeight: '20px',
                        fontFamily: 'Gbold',
                        ml: -0.5,
                      }}
                    >
                      重排序模型
                    </Box>
                  )}
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    小模型
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    必选
                  </Box>
                </Stack>
                <Box sx={{ fontSize: 12, color: 'text.tertiary', mt: 1 }}>
                  在
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能问答{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能搜索{' '}
                  </Box>
                  过程中使用。
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, flexSelf: 'flex-start' }}>
                {rerankModelData ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.success.main,
                        0.1,
                      ),
                      color: 'success.main',
                    }}
                  >
                    状态正常
                  </Box>
                ) : (
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Box
                      sx={{
                        fontSize: 12,
                        px: 1,
                        lineHeight: '20px',
                        borderRadius: '10px',
                        bgcolor: addOpacityToColor(
                          theme.palette.error.main,
                          0.1,
                        ),
                        color: 'error.main',
                      }}
                    >
                      必填配置
                    </Box>
                    <Stack
                      alignItems={'center'}
                      justifyContent={'center'}
                      sx={{ width: 22, height: 22, cursor: 'pointer' }}
                    >
                      <LottieIcon
                        id='warning'
                        src={ErrorJSON}
                        style={{ width: 20, height: 20 }}
                      />
                    </Stack>
                    <Box sx={{ color: 'error.main', fontSize: 12 }}>
                      未配置无法使用，如果没有可用模型，可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </Stack>
                )}
              </Box>
              <Button
                size='small'
                variant='outlined'
                loading={openingAdd === 'rerank'}
                onClick={() => handleOpenAdd('rerank')}
              >
                {rerankModelData ? '修改' : '配置'}
              </Button>
            </Stack>
          </Card>

          {/* Analysis */}
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
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Box>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={1}
                  sx={{ width: 500 }}
                >
                  {analysisModelData ? (
                    <>
                      <Icon
                        type={
                          ModelProvider[
                            analysisModelData.provider as keyof typeof ModelProvider
                          ].icon
                        }
                        sx={{ fontSize: 18 }}
                      />
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'text.tertiary',
                        }}
                      >
                        {ModelProvider[
                          analysisModelData.provider as keyof typeof ModelProvider
                        ].cn ||
                          ModelProvider[
                            analysisModelData.provider as keyof typeof ModelProvider
                          ].label ||
                          '其他'}
                        &nbsp;&nbsp;/
                      </Box>
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          fontFamily: 'Gbold',
                          ml: -0.5,
                        }}
                      >
                        {analysisModelData.model}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          px: 1,
                          lineHeight: '20px',
                          borderRadius: '10px',
                          bgcolor: addOpacityToColor(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          color: 'primary.main',
                        }}
                      >
                        文档分析模型
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        fontSize: 14,
                        lineHeight: '20px',
                        fontFamily: 'Gbold',
                        ml: -0.5,
                      }}
                    >
                      文档分析模型
                    </Box>
                  )}
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    小模型
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: theme.palette.divider,
                      color: 'text.tertiary',
                    }}
                  >
                    可选
                  </Box>
                  {analysisModelData && (
                    <Switch
                      size='small'
                      checked={analysisModelData.is_active}
                      onChange={() => {
                        // @ts-expect-error base_url 可能为 undefined
                        putApiV1Model({
                          ...analysisModelData,
                          is_active: !analysisModelData.is_active,
                        }).then(() => {
                          message.success('修改成功');
                          getModelList();
                        });
                      }}
                    />
                  )}
                </Stack>
                <Box sx={{ fontSize: 12, color: 'text.tertiary', mt: 1 }}>
                  在
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    内容发布{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能问答{' '}
                  </Box>
                  过程中使用， 启用后智能问答的效果会得到加强，可选配置。
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, flexSelf: 'flex-start' }}>
                {analysisModelData ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.success.main,
                        0.1,
                      ),
                      color: 'success.main',
                    }}
                  >
                    状态正常
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: theme.palette.divider,
                      color: 'text.tertiary',
                    }}
                  >
                    可选模型
                  </Box>
                )}
              </Box>
              <Button
                size='small'
                variant='outlined'
                loading={openingAdd === 'analysis'}
                onClick={() => handleOpenAdd('analysis')}
              >
                {analysisModelData ? '修改' : '配置'}
              </Button>
            </Stack>
          </Card>

          {/* Analysis-VL */}
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
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Box>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={1}
                  sx={{ width: 500 }}
                >
                  {analysisVLModelData ? (
                    <>
                      <Icon
                        type={
                          ModelProvider[
                            analysisVLModelData.provider as keyof typeof ModelProvider
                          ].icon
                        }
                        sx={{ fontSize: 18 }}
                      />
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          color: 'text.tertiary',
                        }}
                      >
                        {ModelProvider[
                          analysisVLModelData.provider as keyof typeof ModelProvider
                        ].cn ||
                          ModelProvider[
                            analysisVLModelData.provider as keyof typeof ModelProvider
                          ].label ||
                          '其他'}
                        &nbsp;&nbsp;/
                      </Box>
                      <Box
                        sx={{
                          fontSize: 14,
                          lineHeight: '20px',
                          fontFamily: 'Gbold',
                          ml: -0.5,
                        }}
                      >
                        {analysisVLModelData.model}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          px: 1,
                          lineHeight: '20px',
                          borderRadius: '10px',
                          bgcolor: addOpacityToColor(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          color: 'primary.main',
                        }}
                      >
                        图像分析模型
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        fontSize: 14,
                        lineHeight: '20px',
                        fontFamily: 'Gbold',
                        ml: -0.5,
                      }}
                    >
                      图像分析模型
                    </Box>
                  )}
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.primary.main,
                        0.1,
                      ),
                      color: 'primary.main',
                    }}
                  >
                    视觉模型
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: theme.palette.divider,
                      color: 'text.tertiary',
                    }}
                  >
                    可选
                  </Box>
                  {analysisVLModelData && (
                    <Switch
                      size='small'
                      checked={analysisVLModelData.is_active}
                      onChange={() => {
                        // @ts-expect-error base_url 可能为 undefined
                        putApiV1Model({
                          ...analysisVLModelData,
                          is_active: !analysisVLModelData.is_active,
                        }).then(() => {
                          message.success('修改成功');
                          getModelList();
                        });
                      }}
                    />
                  )}
                </Stack>
                <Box sx={{ fontSize: 12, color: 'text.tertiary', mt: 1 }}>
                  在
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    内容发布{' '}
                  </Box>
                  和
                  <Box component='span' sx={{ fontWeight: 'bold' }}>
                    {' '}
                    智能问答{' '}
                  </Box>
                  过程中使用，启用后图像分析能力可用，可选配置。
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, flexSelf: 'flex-start' }}>
                {analysisVLModelData ? (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: addOpacityToColor(
                        theme.palette.success.main,
                        0.1,
                      ),
                      color: 'success.main',
                    }}
                  >
                    状态正常
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'inline-block',
                      fontSize: 12,
                      px: 1,
                      lineHeight: '20px',
                      borderRadius: '10px',
                      bgcolor: theme.palette.divider,
                      color: 'text.tertiary',
                    }}
                  >
                    可选模型
                  </Box>
                )}
              </Box>
              <Button
                size='small'
                variant='outlined'
                loading={openingAdd === 'analysis-vl'}
                onClick={() => handleOpenAdd('analysis-vl')}
              >
                {analysisVLModelData ? '修改' : '配置'}
              </Button>
            </Stack>
          </Card>
        </>
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
