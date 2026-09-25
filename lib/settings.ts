// lib/settings.ts
import * as FileSystem from 'expo-file-system/legacy';

export type Settings = {
  theme: 'system' | 'light' | 'dark';
  continuePlaybackOnKill: boolean;
  headphoneControls: boolean;
  autoplayNext: boolean;
  crossfade: boolean;
  normalizeVolume: boolean;
  showHiddenFiles: boolean;
  /**
   * Hide songs shorter than this many seconds.
   * 0 = show everything. 60 = hide anything under 1 minute.
   */
  minSongDuration: number;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  continuePlaybackOnKill: true,
  headphoneControls: true,
  autoplayNext: true,
  crossfade: false,
  normalizeVolume: false,
  showHiddenFiles: false,
  minSongDuration: 0,
};

const SETTINGS_PATH = FileSystem.documentDirectory + 'settings.json';

export async function loadSettings(): Promise<Settings> {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_PATH);
    if (!info.exists) return DEFAULT_SETTINGS;
    const raw = await FileSystem.readAsStringAsync(SETTINGS_PATH);
    return {
      ...DEFAULT_SETTINGS,
      ...(JSON.parse(raw) as Partial<Settings>),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      SETTINGS_PATH,
      JSON.stringify(settings)
    );
  } catch {
    // storage unavailable — ignore
  }
}

export async function clearSettings(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(SETTINGS_PATH, { idempotent: true });
    }
  } catch {
    // ignore
  }
}