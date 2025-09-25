import React from 'react';
import { TextField, SxProps } from '@mui/material';

interface PyrenzNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sx?: SxProps;
}

export function PyrenzNumberInput({
  value,
  onChange,
  min,
  max,
  step,
  sx,
}: PyrenzNumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) onChange(val);
  };

  return (
    <TextField
      type="number"
      value={value}
      onChange={handleChange}
      inputProps={{ min, max, step }}
      size="small"
      sx={{ width: 100, ...sx }}
    />
  );
}

interface PyrenzTextInputProps {
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps;
}

export function PyrenzTextInput({ value, onChange, sx }: PyrenzTextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value);

  return (
    <TextField
      value={value}
      onChange={handleChange}
      size="small"
      sx={{ width: 200, ...sx }}
    />
  );
}
