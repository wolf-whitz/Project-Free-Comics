import { Alert, AlertTitle, styled } from '@mui/material';

export const PyrenzAlertTitle = styled(AlertTitle)({
  fontWeight: 'bold',
  fontSize: '1.1rem',
});

export const PyrenzAlertMain = styled(Alert)({
  width: '100%',
  '& .MuiAlert-icon': {
    alignItems: 'center',
  },
});

export const StyledPyrenzAlert = styled('div')({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  cursor: 'grab',
});
