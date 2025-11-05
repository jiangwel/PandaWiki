import ErrorJSON from '@/assets/json/error.json';
import Card from '@/components/Card';
import { ModelProvider } from '@/constant/enums';
import { getApiV1ModelList } from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setModelList, setModelStatus } from '@/store/slices/config';
import { Icon, message, Modal } from '@ctzhian/ui';
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import LottieIcon from '../LottieIcon';
import Member from './component/Member';
import ModelConfig from './component/ModelConfig';

const SystemTabs = [
  { label: '模型配置', id: 'model-config' },
  { label: '用户管理', id: 'user-management' },
];

const System = () => {
  const theme = useTheme();
  const { user, modelList, isCreateWikiModalOpen } = useAppSelector(
    state => state.config,
  );
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('model-config');
  const dispatch = useAppDispatch();
  const [chatModelData, setChatModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [embeddingModelData, setEmbeddingModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [rerankModelData, setRerankModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [analysisModelData, setAnalysisModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);
  const [analysisVLModelData, setAnalysisVLModelData] =
    useState<GithubComChaitinPandaWikiDomainModelListItem | null>(null);

  const disabledClose =
    !chatModelData || !embeddingModelData || !rerankModelData;

  const getModelList = () => {
    getApiV1ModelList().then(res => {
      dispatch(
        setModelList(res as GithubComChaitinPandaWikiDomainModelListItem[]),
      );
    });
  };

  const handleModelList = (
    list: GithubComChaitinPandaWikiDomainModelListItem[],
  ) => {
    const chat = list.find(it => it.type === 'chat') || null;
    const embedding = list.find(it => it.type === 'embedding') || null;
    const rerank = list.find(it => it.type === 'rerank') || null;
    const analysis = list.find(it => it.type === 'analysis') || null;
    const analysisVL = list.find(it => it.type === 'analysis-vl') || null;
    setChatModelData(chat);
    setEmbeddingModelData(embedding);
    setRerankModelData(rerank);
    setAnalysisModelData(analysis);
    setAnalysisVLModelData(analysisVL);
    const status = chat && embedding && rerank;
    if (!status) setOpen(true);
    dispatch(setModelStatus(status));
  };

  useEffect(() => {
    if (modelList) {
      handleModelList(modelList);
    }
  }, [modelList]);

  useEffect(() => {
    if (isCreateWikiModalOpen) {
      setOpen(false);
    }
  }, [isCreateWikiModalOpen]);

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {user.role === 'admin' && (
          <Button
            size='small'
            variant='outlined'
            startIcon={<Icon type='icon-a-chilunshezhisheding' />}
            onClick={() => setOpen(true)}
          >
            系统配置
          </Button>
        )}

        {(!chatModelData || !embeddingModelData || !rerankModelData) && (
          <Tooltip arrow title='暂未配置模型'>
            <Stack
              alignItems={'center'}
              justifyContent={'center'}
              sx={{
                width: 22,
                height: 22,
                cursor: 'pointer',
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                bgcolor: '#fff',
                borderRadius: '50%',
              }}
            >
              <LottieIcon
                id='warning'
                src={ErrorJSON}
                style={{ width: 20, height: 20 }}
              />
            </Stack>
          </Tooltip>
        )}
      </Box>
      <Modal
        title='系统配置'
        width={1100}
        open={open}
        closable={!disabledClose}
        disableEscapeKeyDown={disabledClose}
        disableEnforceFocus={true}
        footer={null}
        onCancel={() => setOpen(false)}
      >
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          aria-label='system tabs'
          sx={{ mb: 2 }}
        >
          {SystemTabs.map(tab => (
            <Tab key={tab.id} label={tab.label} value={tab.id} />
          ))}
        </Tabs>
        {activeTab === 'user-management' && <Member />}
        {activeTab === 'model-config' && (
          <ModelConfig
            onCloseModal={() => setOpen(false)}
            chatModelData={chatModelData}
            embeddingModelData={embeddingModelData}
            rerankModelData={rerankModelData}
            analysisModelData={analysisModelData}
            analysisVLModelData={analysisVLModelData}
            getModelList={getModelList}
          />
        )}
      </Modal>
    </>
  );
};
export default System;
