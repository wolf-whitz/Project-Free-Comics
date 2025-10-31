import { styled } from '@mui/material/styles';
import { Switch } from '@mui/material';

interface GlassSwitchProps {
  color?: string;
}

export const GlassSwitch = styled(Switch, {
  shouldForwardProp: (prop) => prop !== 'color',
})<GlassSwitchProps>(({ color = '#ff69b4' }) => ({
  width: 44,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 1,
    '&.Mui-checked': {
      transform: 'translateX(18px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: `${color}33`,
        opacity: 1,
        border: '1px solid rgba(255,255,255,0.1)',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: color,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    opacity: 1,
  },
}));
