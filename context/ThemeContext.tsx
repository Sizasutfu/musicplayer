// context/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  type Settings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from '../lib/settings';
import {
  type DesignSystem,
  LIGHT_DESIGN,
  DARK_DESIGN,
} from '../lib/design';

// ── Color tokens ─────────────────────────────────────────
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryText: string;
  icon: string;
  iconMuted: string;
  rowActive: string;
  danger: string;
  headerBg: string;
  headerBorder: string;
  searchBg: string;
  chipBg: string;
  chipText: string;
  chipBgActive: string;
  chipTextActive: string;
  artPlaceholder: string;
  miniPlayerBg: string;
  miniPlayerText: string;
  miniPlayerTextSecondary: string;
  miniPlayerBtnBg: string;
  miniPlayerBorder: string;
  fabShadow: string;
};

export const LIGHT: ThemeColors = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#f5f6f8',
  text: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e5e7eb',
  borderSubtle: '#eef0f2',
  primary: '#0a63ff',
  primaryText: '#ffffff',
  icon: '#111111',
  iconMuted: '#888888',
  rowActive: '#f0f6ff',
  danger: '#ef4444',
  headerBg: '#ffffff',
  headerBorder: '#e5e7eb',
  searchBg: '#f1f3f5',
  chipBg: '#f1f3f5',
  chipText: '#555555',
  chipBgActive: '#0a63ff',
  chipTextActive: '#ffffff',
  artPlaceholder: '#eceff1',
  // Light mode: mini player is DARK — contrasts against the white page.
  miniPlayerBg: '#111111',
  miniPlayerText: '#ffffff',
  miniPlayerTextSecondary: 'rgba(255,255,255,0.65)',
  miniPlayerBtnBg: 'rgba(255,255,255,0.08)',
  miniPlayerBorder: 'transparent',
  fabShadow: '#0a63ff',
};

export const DARK: ThemeColors = {
  background: '#0e0e10',
  surface: '#18181b',
  surfaceElevated: '#1c1c1f',
  text: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#27272a',
  borderSubtle: '#1f2024',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  icon: '#f4f4f5',
  iconMuted: '#a1a1aa',
  rowActive: '#1e293b',
  danger: '#f87171',
  headerBg: '#0e0e10',
  headerBorder: '#0e0e10',
  searchBg: '#1f2024',
  chipBg: '#1f2024',
  chipText: '#a1a1aa',
  chipBgActive: '#3b82f6',
  chipTextActive: '#ffffff',
  artPlaceholder: '#27272a',
  // Dark mode: mini player is LIGHT — contrasts against the dark page.
  miniPlayerBg: '#f4f4f5',
  miniPlayerText: '#111111',
  miniPlayerTextSecondary: 'rgba(0,0,0,0.6)',
  miniPlayerBtnBg: 'rgba(0,0,0,0.06)',
  miniPlayerBorder: 'transparent',
  fabShadow: '#000000',
};

// ── Context ──────────────────────────────────────────────
type ThemeContextValue = {
  settings: Settings;
  colors: ThemeColors;
  design: DesignSystem;
  isDark: boolean;
  loaded: boolean;
  setTheme: (mode: Settings['theme']) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const setTheme = useCallback(
    (mode: Settings['theme']) => updateSetting('theme', mode),
    [updateSetting]
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return systemScheme === 'dark';
  }, [settings.theme, systemScheme]);

  const colors = isDark ? DARK : LIGHT;
  const design = isDark ? DARK_DESIGN : LIGHT_DESIGN;

  const value = useMemo<ThemeContextValue>(
    () => ({
      settings,
      colors,
      design,
      isDark,
      loaded,
      setTheme,
      updateSetting,
      resetSettings,
    }),
    [
      settings,
      colors,
      design,
      isDark,
      loaded,
      setTheme,
      updateSetting,
      resetSettings,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export function useSettings() {
  const { settings, loaded, updateSetting, resetSettings } = useTheme();
  return {
    settings,
    loaded,
    update: updateSetting,
    reset: resetSettings,
  };
}