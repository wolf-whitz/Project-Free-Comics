import { Box, Typography, keyframes, styled } from '@mui/material';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';

const hoverZoom = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
`;

export const PyrenzDropzone = styled(Box)(({ theme }) => ({
  border: '2px dashed rgba(174,228,255,0.3)',
  borderRadius: 20,
  padding: theme.spacing(6),
  textAlign: 'center',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  background:
    'linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0.06))',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    animation: `${hoverZoom} 0.3s forwards`,
    borderColor: 'rgba(174,228,255,0.6)',
    background:
      'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.1))',
  },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
}));
