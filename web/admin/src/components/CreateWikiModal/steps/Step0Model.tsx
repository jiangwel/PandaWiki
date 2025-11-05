import React, { useState, useImperativeHandle, Ref, useEffect } from 'react';
import { Box } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store';
import { setModelList } from '@/store/slices/config';
import { getApiV1ModelList, getApiV1ModelModeSetting } from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import ModelConfig from '@/components/System/component/ModelConfig';

interface Step0ModelProps {
  ref: Ref<{ onSubmit: () => Promise<void> }>;
}

const Step0Model: React.FC<Step0ModelProps> = ({ ref }) => {
  const { modelList } = useAppSelector(state => state.config);
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
  const [isAutoMode, setIsAutoMode] = useState(false);

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
  };

  useEffect(() => {
    if (modelList) {
      handleModelList(modelList);
    }
  }, [modelList]);

  const onSubmit = async () => {
    // 检查模型模式设置
    try {
      const modeSetting = await getApiV1ModelModeSetting();

      // 如果是 auto 模式,检查是否配置了 API key
      if (modeSetting?.mode === 'auto') {
        if (!modeSetting?.auto_mode_api_key) {
          return Promise.reject(new Error('请完成模型配置'));
        }
      } else {
        if (!chatModelData || !embeddingModelData || !rerankModelData) {
          return Promise.reject(new Error('请配置必要的模型'));
        }
      }
    } catch (error) {
      return Promise.reject(new Error('获取模型模式设置失败'));
    }

    return Promise.resolve();
  };

  useImperativeHandle(ref, () => ({
    onSubmit,
  }));

  return (
    <Box>
      <ModelConfig
        onCloseModal={() => {}}
        chatModelData={chatModelData}
        embeddingModelData={embeddingModelData}
        rerankModelData={rerankModelData}
        analysisModelData={analysisModelData}
        analysisVLModelData={analysisVLModelData}
        getModelList={getModelList}
        autoSwitchToAutoMode={true}
      />
    </Box>
  );
};

export default Step0Model;
