// lib/onboarding.ts
import * as FileSystem from 'expo-file-system/legacy';

const FLAG_PATH = FileSystem.documentDirectory + 'onboarding.json';

export async function hasSeenOnboarding(): Promise<boolean> {
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
  try {
    const info = await FileSystem.getInfoAsync(FLAG_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(FLAG_PATH, { idempotent: true });
    }
  } catch {
    // ignore
  }
}