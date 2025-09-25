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
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0,0,0,0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 14,
  padding: '10px 24px',
  textTransform: 'none',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  }),
  border: `1.5px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(174, 228, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)'
  }`,
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',

  '&:hover': {
    animation: `${zoomIn} 0.3s ease forwards`,
    color:
      theme.palette.mode === 'dark'
        ? theme.palette.primary.light
        : theme.palette.primary.dark,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0,0,0,0.08)',
    border: `1.5px solid ${
      theme.palette.mode === 'dark'
        ? 'rgba(174, 228, 255, 0.4)'
        : 'rgba(0,0,0,0.15)'
    }`,
    boxShadow: 'none',
  },

  '&:active': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(0, 188, 212, 0.18)'
        : 'rgba(0, 150, 136, 0.15)',
    color: theme.palette.primary.contrastText,
    transform: 'scale(0.96)',
    border: `1.5px solid ${
      theme.palette.mode === 'dark'
        ? 'rgba(174, 228, 255, 0.3)'
        : 'rgba(0,0,0,0.12)'
    }`,
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
}: PyrenzButtonProps) => {
  return (
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
};
