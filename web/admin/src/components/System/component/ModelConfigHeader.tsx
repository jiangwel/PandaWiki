import {
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

interface ModelConfigHeaderProps {
  tempMode: 'auto' | 'manual';
  savedMode: 'auto' | 'manual';
  isSaving: boolean;
  onModeChange: (mode: 'auto' | 'manual') => void;
  onSave: () => void;
}

const ModelConfigHeader = ({
  tempMode,
  savedMode,
  isSaving,
  onModeChange,
  onSave,
}: ModelConfigHeaderProps) => {
  return (
    <Box sx={{ pl: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 1,
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
          模型配置
        </Box>
        <RadioGroup
          row
          value={tempMode}
          onChange={e => {
            const newMode = e.target.value as 'auto' | 'manual';
            onModeChange(newMode);
          }}
        >
          <FormControlLabel
            value='auto'
            control={<Radio size='small' />}
            label='自动配置'
          />
          <FormControlLabel
            value='manual'
            control={<Radio size='small' />}
            label='手动配置'
          />
        </RadioGroup>
      </Box>
      <Button
        variant='contained'
        size='small'
        loading={isSaving}
        disabled={tempMode === savedMode}
        onClick={onSave}
        sx={{ mt: 3 }}
      >
        保存
      </Button>
    </Box>
  );
};

export default ModelConfigHeader;
