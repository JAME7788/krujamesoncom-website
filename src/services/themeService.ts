// ระบบ Theme — Dark mode + Custom color
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: ThemeMode;
  primary: string;
  primaryDark: string;
  schoolName: string;
  schoolLogo: string; // emoji หรือ text
}

const KEY = 'krujames_theme_v1';

const DEFAULT: ThemeConfig = {
  mode: 'light',
  primary: '#FFD43B',
  primaryDark: '#FAB005',
  schoolName: 'Kru James Soncom',
  schoolLogo: 'KJ',
};

export const loadTheme = (): ThemeConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
};

export const saveTheme = (cfg: ThemeConfig) => {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* ignore localStorage write errors */ }
  applyTheme(cfg);
};

/** Apply theme variables to <html> */
export const applyTheme = (cfg: ThemeConfig) => {
  const root = document.documentElement;
  // Determine effective mode
  let effective = cfg.mode;
  if (cfg.mode === 'auto') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', effective);
  root.style.setProperty('--primary', cfg.primary);
  root.style.setProperty('--primary-dark', cfg.primaryDark);

  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', cfg.primary);
};

/** React hook สำหรับ theme */
export const useTheme = () => {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen to OS theme change (for 'auto' mode)
  useEffect(() => {
    if (theme.mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(theme);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const update = (patch: Partial<ThemeConfig>) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    saveTheme(next);
  };

  const toggleMode = () => {
    const next = theme.mode === 'dark' ? 'light' : 'dark';
    update({ mode: next });
  };

  return { theme, update, toggleMode };
};

// Initialize on first import
if (typeof window !== 'undefined') {
  applyTheme(loadTheme());
}
