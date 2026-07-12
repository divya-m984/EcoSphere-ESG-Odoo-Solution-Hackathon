import { createTheme } from '@mui/material/styles';

type PaletteMode = 'light' | 'dark';

// ── Theme factory ─────────────────────────────────────────────────────────────

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,

      primary: {
        main:         isDark ? '#38BDF8' : '#4A6B8A',
        light:        isDark ? '#7DD3FC' : '#6B8FAD',
        dark:         isDark ? '#0EA5E9' : '#2D4F6A',
        contrastText: isDark ? '#0F172A' : '#FFFFFF',
      },

      secondary: {
        main:         isDark ? '#5EEAD4' : '#689D9D',
        light:        isDark ? '#99F6E4' : '#8CBABA',
        dark:         isDark ? '#14B8A6' : '#4A7D7D',
        contrastText: isDark ? '#0F172A' : '#FFFFFF',
      },

      background: {
        default: isDark ? '#0F172A' : '#F0F4F8',
        paper:   isDark ? '#19263A' : '#FFFFFF',
      },

      text: {
        primary:   isDark ? '#E2E8F0' : '#1E3A5F',
        secondary: isDark ? '#94A3B8' : '#5B7A9D',
      },

      divider: isDark ? '#1E293B' : 'rgba(0,0,0,0.08)',

      success: { main: isDark ? '#34D399' : '#388E3C' },
      warning: { main: isDark ? '#FBBF24' : '#F57C00' },
      error:   { main: isDark ? '#F87171' : '#C62828' },

      action: {
        hover:              isDark ? 'rgba(56,189,248,0.08)'  : 'rgba(74,107,138,0.06)',
        selected:           isDark ? 'rgba(56,189,248,0.16)'  : 'rgba(74,107,138,0.12)',
        disabled:           isDark ? 'rgba(226,232,240,0.3)'  : 'rgba(0,0,0,0.26)',
        disabledBackground: isDark ? 'rgba(226,232,240,0.12)' : 'rgba(0,0,0,0.12)',
      },
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: '2.5rem' },
      h2: { fontWeight: 700, fontSize: '2rem' },
      h3: { fontWeight: 600, fontSize: '1.75rem' },
      h4: { fontWeight: 600, fontSize: '1.5rem' },
      h5: { fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      body1: { fontSize: '0.95rem' },
      body2: { fontSize: '0.85rem' },
    },

    shape: { borderRadius: 6 },

    components: {
      // Remove MUI dark-mode gradient on Paper/elevated surfaces
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 6,
            padding: '7px 18px',
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },

      // Sidebar — slightly darker surface than background.paper
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#111B30' : '#EEF2F7',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },

      // Top app bar
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#111B30' : '#FFFFFF',
            color: theme.palette.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },

      // Navigation items — selected state driven from theme
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 6,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(56,189,248,0.14)'
                  : 'rgba(74,107,138,0.10)',
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(56,189,248,0.22)'
                    : 'rgba(74,107,138,0.16)',
              },
            },
          }),
        },
      },

      // Table header background
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === 'dark' ? '#162238' : '#F7FAFC',
          }),
        },
      },

      MuiChip: {
        styleOverrides: { root: { borderRadius: 6 } },
      },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 10, backgroundImage: 'none' },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 6,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.02)',
          }),
        },
      },
    },
  });
}

// Backward-compatible default export (light theme)
export default createAppTheme('light');
