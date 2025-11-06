import React, { useImperativeHandle, Ref } from 'react';
import { Box } from '@mui/material';

interface Step1ModelProps {
  ref: Ref<{ onSubmit: () => Promise<void> }>;
}

const Step1Model: React.FC<Step1ModelProps> = ({ ref }) => {
  const onSubmit = async () => {
    return Promise.resolve();
  };

  useImperativeHandle(ref, () => ({
    onSubmit,
  }));

  return <Box></Box>;
};

export default Step1Model;
