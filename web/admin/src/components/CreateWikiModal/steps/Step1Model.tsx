import React, { useState, useImperativeHandle, Ref, useEffect } from 'react';
import { Box } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store';
import { setModelList } from '@/store/slices/config';
import { getApiV1ModelList } from '@/request/Model';
import { GithubComChaitinPandaWikiDomainModelListItem } from '@/request/types';
import ModelConfig from '@/components/System/component/ModelConfig';

interface Step1ModelProps {
  ref: Ref<{ onSubmit: () => Promise<void> }>;
}

const Step1Model: React.FC<Step1ModelProps> = ({ ref }) => {
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
    // 验证必须配置的模型
    if (!chatModelData || !embeddingModelData || !rerankModelData) {
      return Promise.reject(new Error('请配置必要的模型'));
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
      />
    </Box>
  );
};

export default Step1Model;
