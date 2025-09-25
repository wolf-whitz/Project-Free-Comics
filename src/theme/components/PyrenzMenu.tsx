import { Menu, MenuProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PyrenzMenu = styled((props: MenuProps) => (
  <Menu
    elevation={8}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: theme.spacing(1),
    minWidth: 180,
    color: '#fff',
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
    transition: '0.25s ease all',
    '& .MuiMenuItem-root': {
      borderRadius: '10px',
      padding: '10px 14px',
      transition: '0.2s',
      fontSize: '0.9rem',
      color: '#ccc',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.06)',
        color: '#fff',
      },
      '&:active': {
        background: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
}));
