"use client";

import React from "react";
import { Box, Slider, Typography, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface PageSliderProps {
  currentPage: number;
  maxPages: number;
  onChange: (value: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export function PageSlider({ currentPage, maxPages, onChange, onPrevChapter, onNextChapter }: PageSliderProps) {
  const handleSliderChange = (_: Event, value: number | number[]) => {
    if (typeof value === "number") onChange(value);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        px: 2,
        py: 1,
        bgcolor: "rgba(0,0,0,0.6)",
        borderRadius: 50,
        display: "flex",
        alignItems: "center",
        gap: 1,
        zIndex: 999,
        width: "90%",
        maxWidth: 600,
      }}
    >
      <IconButton sx={{ color: "#fff" }} onClick={onPrevChapter}>
        <ArrowBackIosNewIcon />
      </IconButton>

      <Typography sx={{ color: "#fff", minWidth: 40, textAlign: "center" }}>
        {currentPage} / {maxPages}
      </Typography>

      <Slider
        min={1}
        max={maxPages}
        value={currentPage}
        onChange={handleSliderChange}
        sx={{
          color: "#1976d2",
          flex: 1,
          height: 6,
          borderRadius: 3,
          '& .MuiSlider-thumb': { width: 16, height: 16 },
        }}
      />

      <IconButton sx={{ color: "#fff" }} onClick={onNextChapter}>
        <ArrowForwardIosIcon />
      </IconButton>
    </Box>
  );
}
