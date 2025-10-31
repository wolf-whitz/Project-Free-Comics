export const componentOverrides = (theme: any) => ({
  values: {
    xs: theme.breakpoints.values.xs,
    sm: theme.breakpoints.values.sm,
    md: theme.breakpoints.values.md,
    lg: theme.breakpoints.values.lg,
    xl: theme.breakpoints.values.xl,
  },
  MuiSlider: {
    styleOverrides: {
      thumb: {
        color: theme.palette.primary.main,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        color: theme.palette.secondary.main,
        transition: "transform 0.3s ease, color 0.3s ease",
        "&:hover": {
          backgroundColor: "transparent",
          color: theme.palette.action.hover,
          transform: "scale(1.2)",
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: "4px",
        backgroundColor: theme.palette.primary.main,
        color:
          theme.palette.mode === "dark"
            ? theme.palette.text.primary
            : theme.palette.text.secondary,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: theme.palette.primary.main,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
      },
    },
  },
});
