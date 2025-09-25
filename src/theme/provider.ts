"use client";

import { createTheme, ThemeOptions } from "@mui/material/styles";
import { componentOverrides } from "./overrides/componentOverrides";

const baseThemeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: `"Baloo 2", "Baloo Da 2", sans-serif`,
  },
};

const baseTheme = createTheme(baseThemeOptions);

export const theme = createTheme(baseTheme, {
  components: componentOverrides(baseTheme),
});

export default theme;
