"use client";

import { useState } from "react";
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

import { Library, SearchPage, SettingsPage } from "./home";

export default function Home() {
  const [value, setValue] = useState(0);

  let content;
  if (value === 0) content = <Library />;
  else if (value === 1) content = <SearchPage />;
  else content = <SettingsPage />;

  return (
    <Box sx={{ flexGrow: 1, pb: 7 }}>
      <Box>{content}</Box>

      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => setValue(newValue)}
        >
          <BottomNavigationAction label="Library" icon={<HomeIcon />} />
          <BottomNavigationAction label="Search" icon={<SearchIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
