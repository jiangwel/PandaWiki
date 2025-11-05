import { useState, useRef, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';
import { Modal, message } from '@ctzhian/ui';
import { useLocation } from 'react-router-dom';
import {
  setKbC,
  setIsRefreshDocList,
  setIsCreateWikiModalOpen,
} from '@/store/slices/config';
import { useAppSelector, useAppDispatch } from '@/store';
import { postApiV1KnowledgeBaseRelease } from '@/request/KnowledgeBase';
import {
  Step0Model,
  Step1Config,
  Step2Import,
  Step3Publish,
  Step4Test,
  Step5Decorate,
  Step6Complete,
} from './steps';
import dayjs from 'dayjs';

// Remove interface as we're using Redux state

const steps = [
  '模型配置',
  '配置监听',
  '录入文档',
  '发布内容',
  '问答测试',
  '装饰页面',
  '完成配置',
];

const CreateWikiModal = () => {
  const { kb_c, kb_id, kbList, modelStatus } = useAppSelector(
    state => state.config,
  );
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const Step0ModelRef = useRef<{ onSubmit: () => Promise<void> }>(null);
  const step1ConfigRef = useRef<{ onSubmit: () => Promise<void> }>(null);
  const step2ImportRef = useRef<{
    onSubmit: () => Promise<Record<'id', string>[]>;
  }>(null);
  const step5DecorateRef = useRef<{ onSubmit: () => Promise<void> }>(null);

  const onCancel = () => {
    dispatch(setKbC(false));
    setOpen(false);
    if (location.pathname === '/') {
      dispatch(setIsRefreshDocList(true));
    }
  };

  const onPublish = () => {
    return postApiV1KnowledgeBaseRelease({
      kb_id,
      message: '创建 Wiki 站点',
      tag: `${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).substring(2, 8)}`,
      node_ids: nodeIds,
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setLoading(true);
      Step0ModelRef.current
        ?.onSubmit?.()
        .then(() => {
          setActiveStep(prev => prev + 1);
        })
        .catch(err => {
          message.error(err.message || '验证失败，请检查配置');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeStep === 1) {
      setLoading(true);
      step1ConfigRef.current
        ?.onSubmit?.()
        .then(() => {
          setActiveStep(prev => prev + 1);
        })
        .catch(err => {
          message.error(err.message || '验证失败，请检查配置');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeStep === 2) {
      setLoading(true);
      step2ImportRef.current
        ?.onSubmit?.()
        .then(res => {
          setNodeIds(res.map(item => item.id));
          setActiveStep(prev => prev + 1);
        })
        .catch(err => {
          message.error(err.message || '操作失败，请重试');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeStep === 3) {
      setLoading(true);
      onPublish()
        .then(() => {
          setActiveStep(prev => prev + 1);
        })
        .catch(err => {
          message.error(err.message || '发布失败，请重试');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeStep === 4) {
      setActiveStep(prev => prev + 1);
    } else if (activeStep === 5) {
      setLoading(true);
      step5DecorateRef.current
        ?.onSubmit?.()
        .then(() => {
          setActiveStep(prev => prev + 1);
        })
        .catch(err => {
          message.error(err.message || '保存失败，请重试');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeStep === 6) {
      onCancel();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step0Model ref={Step0ModelRef} />;
      case 1:
        return <Step1Config ref={step1ConfigRef} />;
      case 2:
        return <Step2Import ref={step2ImportRef} />;
      case 3:
        return <Step3Publish />;
      case 4:
        return <Step4Test />;
      case 5:
        return <Step5Decorate ref={step5DecorateRef} nodeIds={nodeIds} />;
      case 6:
        return <Step6Complete />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setNodeIds([]);
        setActiveStep(0);
      }, 300);
    }
    dispatch(setIsCreateWikiModalOpen(open));
  }, [open]);

  useEffect(() => {
    setOpen(kb_c);
  }, [kb_c]);

  useEffect(() => {
    if (kbList?.length === 0 && modelStatus) setOpen(true);
  }, [kbList, modelStatus]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title='创建 Wiki 站点'
      width={880}
      closable={activeStep === 0 && (kbList || []).length > 0}
      showCancel={false}
      okText={activeStep === steps.length - 1 ? '关闭' : '下一步'}
      // cancelText='上一步'
      okButtonProps={{ loading }}
      onOk={handleNext}
    >
      <Box sx={{ display: 'flex', minHeight: 300 }}>
        <Box
          sx={{
            width: '140px',
            borderRight: '1px solid',
            borderColor: 'divider',
            pl: '16px',
            pr: 5,
            flexShrink: 0,
          }}
        >
          <Stepper
            activeStep={activeStep}
            orientation='vertical'
            sx={{
              '& .MuiStepLabel-root': {
                padding: '2px 0',
              },
              '& .MuiStepLabel-label': {
                fontSize: '14px',
                ml: 1,
              },
              '.MuiStepLabel-iconContainer': {
                '.Mui-completed ': {
                  fontSize: 0,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                },
              },
              '.MuiStepConnector-root': {
                ml: '5px',
              },

              '.MuiStepIcon-root': {
                fontSize: '10px',
                color: 'rgba(23,28,25,0.3)',
                '&.Mui-active': {
                  color: 'primary.main',
                },
                '.MuiStepIcon-text': {
                  fontSize: 0,
                },
              },
              '& .MuiStepConnector-line': {
                borderColor: 'divider',
              },
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: index === activeStep ? 'text.primary' : '#717572',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ flex: 1, pl: 5 }}>{renderStepContent()}</Box>
      </Box>
    </Modal>
  );
};

export default CreateWikiModal;
