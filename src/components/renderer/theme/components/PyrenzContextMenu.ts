import { Box, Button, Divider, styled } from '@mui/material';

export const PyrenzMenuContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  backgroundColor: 'rgba(20, 20, 30, 0.6)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
  minWidth: 200,
});

export const PyrenzMenuButton = styled(Button)({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  color: '#f5f5f5',
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: 'scale(1.03)',
    color: '#fff',
  },
});

export const PyrenzMenuDivider = styled(Divider)({
  borderColor: 'rgba(255, 255, 255, 0.15)',
  margin: '4px 0',
});
