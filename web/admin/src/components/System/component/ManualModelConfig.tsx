import ErrorJSON from '@/assets/json/error.json';
import Card from '@/components/Card';
import { ModelProvider } from '@/constant/enums';
import { putApiV1Model } from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import { addOpacityToColor } from '@/utils';
import { Icon, message } from '@ctzhian/ui';
import { Box, Button, Stack, Switch, useTheme } from '@mui/material';
import LottieIcon from '../../LottieIcon';

interface ManualModelConfigProps {
  chatModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  embeddingModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  rerankModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  analysisVLModelData: GithubComChaitinPandaWikiDomainModelListItem | null;
  hideDocumentationHint?: boolean;
  openingAdd:
    | 'chat'
    | 'embedding'
    | 'rerank'
    | 'analysis'
    | 'analysis-vl'
    | null;
  handleOpenAdd: (
    type: 'chat' | 'embedding' | 'rerank' | 'analysis' | 'analysis-vl',
  ) => void;
  getModelList: () => void;
}

const ManualModelConfig = (props: ManualModelConfigProps) => {
  const theme = useTheme();
  const {
    chatModelData,
    embeddingModelData,
    rerankModelData,
    analysisModelData,
    analysisVLModelData,
    hideDocumentationHint = false,
    openingAdd,
    handleOpenAdd,
    getModelList,
  } = props;

  return (
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.success.main, 0.1),
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
                    bgcolor: addOpacityToColor(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  必填配置
                </Box>
                {!hideDocumentationHint && (
                  <>
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
                      未配置无法使用,如果没有可用模型,可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </>
                )}
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.success.main, 0.1),
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
                    bgcolor: addOpacityToColor(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  必填配置
                </Box>
                {!hideDocumentationHint && (
                  <>
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
                      未配置无法使用,如果没有可用模型,可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </>
                )}
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.success.main, 0.1),
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
                    bgcolor: addOpacityToColor(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  必填配置
                </Box>
                {!hideDocumentationHint && (
                  <>
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
                      未配置无法使用,如果没有可用模型,可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </>
                )}
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
              过程中使用。
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
                  bgcolor: addOpacityToColor(theme.palette.success.main, 0.1),
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
                    bgcolor: addOpacityToColor(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  必填配置
                </Box>
                {!hideDocumentationHint && (
                  <>
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
                      未配置无法使用,如果没有可用模型,可参考&nbsp;
                      <Box
                        component={'a'}
                        sx={{ color: 'primary.main', cursor: 'pointer' }}
                        href='https://pandawiki.docs.baizhi.cloud/node/01973ffe-e1bc-7165-9a71-e7aa461c05ea'
                        target='_blank'
                      >
                        文档
                      </Box>
                    </Box>
                  </>
                )}
              </Stack>
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
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
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
              过程中使用,启用后图像分析能力可用,可选配置。
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
                  bgcolor: addOpacityToColor(theme.palette.success.main, 0.1),
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
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
  );
};

export default ManualModelConfig;
