import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColorMode = 'light' | 'dark' | 'system';

interface ColorModeContextType {
  mode: ColorMode;
  effectiveMode: 'light' | 'dark';
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ecosphere_color_mode';

// ── Context ───────────────────────────────────────────────────────────────────

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      // localStorage unavailable
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  // Track OS preference changes live
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveMode: 'light' | 'dark' =
    mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

  const setMode = (newMode: ColorMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // localStorage unavailable
    }
  };

  const toggleMode = () => {
    setMode(effectiveMode === 'dark' ? 'light' : 'dark');
  };

  const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);

  const value = useMemo(
    () => ({ mode, effectiveMode, setMode, toggleMode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, effectiveMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used inside <ColorModeProvider>');
  return ctx;
}
