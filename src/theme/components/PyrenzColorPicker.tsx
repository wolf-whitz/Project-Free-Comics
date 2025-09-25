import React, { useState, useMemo, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { styled } from '@mui/material/styles';
import { Popover, Button, Box } from '@mui/material';
import debounce from 'lodash.debounce';

const ColorButton = styled(Button)({
  width: '40px',
  height: '40px',
  minWidth: '40px',
  borderRadius: '8px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: '#000',
  cursor: 'pointer',
  padding: 0,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
    transform: 'scale(1.05)',
  },
});

interface PyrenzColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const PyrenzColorPicker = ({
  color,
  onChange,
}: PyrenzColorPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempColor, setTempColor] = useState(color);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const debouncedOnChange = useMemo(
    () => debounce((newHex: string) => onChange(newHex), 150),
    [onChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (newColor: ColorResult) => {
    setTempColor(newColor.hex);
  };

  const handleChangeComplete = (newColor: ColorResult) => {
    debouncedOnChange(newColor.hex);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'color-popover' : undefined;

  return (
    <Box fontFamily="Comic Neue, system-ui">
      <ColorButton
        aria-describedby={id}
        style={{ backgroundColor: color }}
        onClick={handleClick}
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            background: 'rgba(30, 30, 30, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          },
        }}
      >
        <SketchPicker
          color={tempColor}
          onChange={handleChange}
          onChangeComplete={handleChangeComplete}
          styles={{
            default: {
              picker: {
                background: 'transparent',
                fontFamily: 'Comic Neue, system-ui',
                padding: '8px',
              },
            },
          }}
        />
      </Popover>
    </Box>
  );
};
