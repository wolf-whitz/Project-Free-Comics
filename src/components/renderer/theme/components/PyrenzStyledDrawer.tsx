import React from 'react';
import { Drawer, Box } from '@mui/material';

interface PyrenzStyledDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const PyrenzStyledDrawer = ({
  isOpen,
  onClose,
  children,
}: PyrenzStyledDrawerProps) => {
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(15px)',
          color: '#FFFFFF',
          width: 200,
          padding: 1,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        },
      }}
    >
      <Box sx={{ paddingTop: 1 }}>{children}</Box>
    </Drawer>
  );
};
