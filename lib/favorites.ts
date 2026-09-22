// lib/favorites.ts
import * as FileSystem from 'expo-file-system/legacy';

const FAVORITES_PATH = FileSystem.documentDirectory + 'favorites.json';

export async function loadFavorites(): Promise<string[]> {
  try {
    const info = await FileSystem.getInfoAsync(FAVORITES_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(FAVORITES_PATH);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(uris: string[]): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      FAVORITES_PATH,
      JSON.stringify(uris)
    );
  } catch {
    // storage unavailable — ignore
  }
}

export async function clearFavorites(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(FAVORITES_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(FAVORITES_PATH, { idempotent: true });
    }
  } catch {
    // ignore
  }
}