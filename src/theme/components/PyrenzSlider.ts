import { Slider, styled } from '@mui/material';

export const PyrenzSlider = styled(Slider)({
  color: '#add8e6',
  height: 8,
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(173, 216, 230, 0.16)',
    },
  },
  '& .MuiSlider-track': {
    border: 'none',
    height: 8,
    borderRadius: 4,
  },
  '& .MuiSlider-rail': {
    color: '#d8d8d8',
    height: 8,
    borderRadius: 4,
  },
  '& .MuiSlider-mark': {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 2,
    marginTop: -3,
  },
  '& .MuiSlider-markActive': {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
  '&:hover .MuiSlider-thumb': {
    boxShadow: '0 0 0 8px rgba(173, 216, 230, 0.2)',
  },
  '& .MuiSlider-thumb.Mui-active': {
    boxShadow: '0 0 0 12px rgba(173, 216, 230, 0.2)',
  },
});
