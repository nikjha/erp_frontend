import { createTheme } from "@mui/material/styles";

// Design tokens
// bg canvas   #F6F7F9  (cool paper, not cream)
// surface     #FFFFFF
// ink         #1B2430  (graphite, not pure black)
// rail        #12192B  (charcoal-navy — the console frame)
// accent      #C88A2E  (muted amber — ledger/stamp feel, used sparingly for primary actions)
// accent alt  #2E6F73  (teal — secondary status/links)
// danger      #B3413B
// success     #2E7D5B
// Signature: monospace (IBM Plex Mono) for anything that is an identifier —
// codes, GSTIN/PAN, IDs, timestamps — everything else in Inter. The record
// data itself becomes the typographic signature, not decoration.

export const tokens = {
  bg: "#F6F7F9",
  surface: "#FFFFFF",
  ink: "#1B2430",
  rail: "#12192B",
  railInk: "#C7CCD6",
  accent: "#C88A2E",
  accentInk: "#3A2A0E",
  accentAlt: "#2E6F73",
  danger: "#B3413B",
  success: "#2E7D5B",
  border: "#E3E6EA",
};

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.ink, secondary: "#5B6472" },
    primary: { main: tokens.accent, contrastText: "#FFFFFF" },
    secondary: { main: tokens.accentAlt, contrastText: "#FFFFFF" },
    error: { main: tokens.danger },
    success: { main: tokens.success },
    divider: tokens.border,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h6: { fontWeight: 600, letterSpacing: 0.2 },
    button: { textTransform: "none", fontWeight: 600 },
    caption: { fontFamily: '"IBM Plex Mono", monospace' },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 6, boxShadow: "none" } },
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: { root: { border: `1px solid ${tokens.border}`, backgroundImage: "none" } },
    },
    MuiChip: {
      styleOverrides: { root: { fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.72rem" } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundColor: tokens.surface, color: tokens.ink, boxShadow: "none", borderBottom: `1px solid ${tokens.border}` } },
    },
  },
});

export default theme;
