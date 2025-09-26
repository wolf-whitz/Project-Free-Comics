import { Button, CircularProgress, Box, styled } from '@mui/material';
import { keyframes } from '@mui/system';
import type { ButtonProps } from '@mui/material';

const zoomIn = keyframes`
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.05);
  }
`;

interface PyrenzButtonProps extends ButtonProps {
  dataState?: 'loading' | string;
}

export const PyrenzBlueButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'dataState',
})<PyrenzButtonProps>(({ theme, dataState }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main, 
  border: `1.5px solid ${theme.palette.primary.dark}`,  
  borderRadius: 14,
  padding: '10px 24px',
  textTransform: 'none',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  }),
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',

  '&:hover': {
    animation: `${zoomIn} 0.3s ease forwards`,
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    border: `1.5px solid ${theme.palette.primary.light}`,
    boxShadow: 'none',
  },

  '&:active': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    transform: 'scale(0.96)',
    border: `1.5px solid ${theme.palette.primary.dark}`,
    boxShadow: 'none',
  },

  ...(dataState === 'loading' && {
    opacity: 0.6,
    pointerEvents: 'none',
    userSelect: 'none',
  }),
}));

export const PyrenzBlueButtonWithLoading = ({
  dataState,
  sx,
  ...props
}: PyrenzButtonProps) => (
  <Box position="relative" display="inline-block">
    <PyrenzBlueButton dataState={dataState} sx={sx} {...props} />
    {dataState === 'loading' && (
      <CircularProgress
        size={24}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          mt: '-12px',
          ml: '-12px',
          color: 'inherit',
        }}
      />
    )}
  </Box>
);
