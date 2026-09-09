import { createTheme } from "@mui/material/styles";

// Design tokens - Updated to match modern ERP design
// Enhanced color scheme with better contrast and visual hierarchy
// bg canvas   #F8F9FB  (lighter cool background)
// surface     #FFFFFF
// ink         #1E293B  (slate, enhanced readability)
// rail        #1E293B  (deep slate-navy — the navigation frame)
// accent      #D97706  (vibrant amber — primary actions, "New Party" button)
// accent alt  #3B82F6  (modern blue — links and secondary actions)
// danger      #DC2626
// success     #10B981
// warning     #F59E0B
// info        #3B82F6
// Signature: monospace (IBM Plex Mono) for codes and identifiers
// Inter for all body text and UI labels

export const tokens = {
  bg: "#F8F9FB",
  surface: "#FFFFFF",
  ink: "#1E293B",
  rail: "#1E293B",
  railInk: "#CBD5E1",
  accent: "#5E6AD2",        // Primary blue for all buttons
  accentInk: "#FFFFFF",
  accentAlt: "#3B82F6",     // Blue for links
  danger: "#DC2626",        // Red for errors/blocked
  success: "#10B981",       // Green for active/success
  warning: "#F59E0B",       // Orange for warnings/inactive
  info: "#3B82F6",          // Blue for info
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.ink, secondary: "#64748B" },
    primary: { main: tokens.accent, contrastText: "#FFFFFF" },
    secondary: { main: tokens.accentAlt, contrastText: "#FFFFFF" },
    error: { main: tokens.danger },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    info: { main: tokens.info },
    divider: tokens.border,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14, // Base font size 14px = 0.875rem
    h1: { fontWeight: 700, fontSize: "2rem" },
    h2: { fontWeight: 700, fontSize: "1.75rem" },
    h6: { fontWeight: 600, letterSpacing: 0.2, fontSize: "1.125rem" },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
    caption: { fontSize: "0.75rem" },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.875rem" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          padding: "8px 16px",
          fontWeight: 600,
        },
        contained: {
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.border}`,
          backgroundImage: "none",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
        }
      },
    },
    // Enhanced chip styling for better status indication
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "0.75rem",
          fontWeight: 500,
          height: "24px",
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          color: tokens.ink,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
          borderBottom: `1px solid ${tokens.border}`,
        }
      },
    },
    // Enhanced TextField styling
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: "0.875rem",
          },
          '& .MuiInputLabel-root': {
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        li: {
          fontSize: "0.875rem",
        },
      },
    },
  },
});

export default theme;
