import React from 'react';
import { Box, BoxProps, Skeleton, Stack } from '@mui/material';

interface PyrenzCardProps extends BoxProps {
  children?: React.ReactNode;
  selected?: boolean;
  loading?: boolean;
}

export function PyrenzCard({
  children,
  selected,
  loading = false,
  sx,
  ...rest
}: PyrenzCardProps) {
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: selected
          ? '1px solid #4ea7f7'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        padding: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'all 0.25s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.04)',
          transform: 'scale(1.015)',
        },
        ...sx,
      }}
      {...rest}
    >
      {loading ? (
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="80%" />
          <Skeleton
            variant="rectangular"
            height={80}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
      ) : (
        children
      )}
    </Box>
  );
}
