// lib/onboarding.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// ── Native: file-based flag ────────────────────────────
// Kept as-is for parity with existing native installs. If we
// switched native to AsyncStorage too, users who already
// finished onboarding would see the welcome screen once more.
const FLAG_PATH = FileSystem.documentDirectory + 'onboarding.json';

// ── Web: AsyncStorage-backed flag ──────────────────────
// The browser has no documentDirectory, so the file API is a
// no-op and hasSeenOnboarding() would always return false.
// AsyncStorage falls back to localStorage on web, which is
// persistent across reloads.
const WEB_KEY = 'onboarding:seen:v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const v = await AsyncStorage.getItem(WEB_KEY);
      return v === 'true';
    } catch {
      return false;
    }
  }

  try {
    const info = await FileSystem.getInfoAsync(FLAG_PATH);
    if (!info.exists) return false;
    const raw = await FileSystem.readAsStringAsync(FLAG_PATH);
    const parsed = JSON.parse(raw);
    return parsed?.seen === true;
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.setItem(WEB_KEY, 'true');
    } catch {
      // ignore
    }
    return;
  }

  try {
    await FileSystem.writeAsStringAsync(
      FLAG_PATH,
      JSON.stringify({ seen: true, at: Date.now() })
    );
  } catch {
    // ignore
  }
}

export async function resetOnboarding(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.removeItem(WEB_KEY);
    } catch {
      // ignore
    }
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(FLAG_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(FLAG_PATH, { idempotent: true });
    }
  } catch {
    // ignore
  }
}