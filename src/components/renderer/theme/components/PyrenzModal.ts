import { Modal, Box, styled, Backdrop } from '@mui/material';
import { motion } from 'framer-motion';

export const PyrenzModal = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}) as typeof Modal;

const MotionBox = motion.create(Box);

export const PyrenzModalContent = styled(MotionBox)(({ theme }) => ({
  position: 'relative',
  backgroundColor: 'rgba(30, 30, 47, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: '#f0f0f0',
  borderRadius: '16px',
  padding: theme.spacing(4),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
  width: 400,
  maxWidth: '90vw',
  height: 'auto',
  maxHeight: '85vh',
  overflowY: 'auto',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    padding: '1px',
    background:
      'linear-gradient(120deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
    pointerEvents: 'none',
    zIndex: 1,
  },
}));
