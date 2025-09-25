import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface PyrenzDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  onConfirm: () => void;
}

export function PyrenzDialog({
  open,
  onClose,
  title,
  content,
  onConfirm,
}: PyrenzDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
      fullWidth
      maxWidth="xs"
      scroll="body"
      aria-labelledby="pyrenz-dialog-title"
      aria-describedby="pyrenz-dialog-description"
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          color: '#fff',
          m: isMobile ? 2 : 'auto',
        },
      }}
    >
      <DialogTitle
        id="pyrenz-dialog-title"
        sx={{ fontWeight: 600, fontSize: '1.3rem', color: '#fff' }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        {typeof content === 'string' ? (
          <DialogContentText
            id="pyrenz-dialog-description"
            sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {content}
          </DialogContentText>
        ) : (
          content
        )}
      </DialogContent>

      <DialogActions sx={{ padding: '16px' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disableRipple
          disableFocusRipple
          sx={{
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            px: 3,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          autoFocus
          variant="contained"
          disableRipple
          disableFocusRipple
          sx={{
            color: '#111',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '10px',
            px: 3,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
