import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useTheme, type ThemeResult } from './useTheme';
import { useAppStore } from '../store/useAppStore';

const ThemeContext = createContext<ThemeResult | null>(null);

/**
 * Applies every themed CSS custom property to :root so all components inherit
 * automatically via var(--token) — no hardcoded colors live in component code.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppStore((s) => s.settings.themeMode);
  const theme = useTheme(mode);

  useEffect(() => {
    const root = document.documentElement.style;
    for (const [prop, value] of Object.entries(theme.cssVars)) {
      root.setProperty(prop, value);
    }
  }, [theme.cssVars]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.cssVars['--accent'] ?? '#C97B4A');
  }, [theme.cssVars]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeResult {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within a ThemeProvider');
  return ctx;
}
