// lib/playlists.ts
import * as FileSystem from 'expo-file-system/legacy';

export type Playlist = {
  id: string;
  name: string;
  trackUris: string[];   // ordered list of Song.url values
  createdAt: number;
  updatedAt: number;
};

const PLAYLISTS_PATH = FileSystem.documentDirectory + 'playlists.json';

export function makeId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function loadPlaylists(): Promise<Playlist[]> {
  try {
    const info = await FileSystem.getInfoAsync(PLAYLISTS_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(PLAYLISTS_PATH);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Playlist[];
  } catch {
    return [];
  }
}

export async function savePlaylists(list: Playlist[]): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      PLAYLISTS_PATH,
      JSON.stringify(list)
    );
  } catch {
    // storage unavailable — ignore
  }
}

export async function createPlaylist(
  list: Playlist[],
  name: string
): Promise<Playlist> {
  const playlist: Playlist = {
    id: makeId(),
    name: name.trim() || 'Untitled Playlist',
    trackUris: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const next = [...list, playlist];
  await savePlaylists(next);
  return playlist;
}

export async function deletePlaylist(
  list: Playlist[],
  id: string
): Promise<Playlist[]> {
  const next = list.filter((p) => p.id !== id);
  await savePlaylists(next);
  return next;
}

export async function renamePlaylist(
  list: Playlist[],
  id: string,
  name: string
): Promise<Playlist[]> {
  const next = list.map((p) =>
    p.id === id
      ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() }
      : p
  );
  await savePlaylists(next);
  return next;
}

export async function addTrackToPlaylist(
  list: Playlist[],
  id: string,
  trackUri: string
): Promise<Playlist[]> {
  const next = list.map((p) => {
    if (p.id !== id) return p;
    if (p.trackUris.includes(trackUri)) return p;
    return {
      ...p,
      trackUris: [...p.trackUris, trackUri],
      updatedAt: Date.now(),
    };
  });
  await savePlaylists(next);
  return next;
}

export async function removeTrackFromPlaylist(
  list: Playlist[],
  id: string,
  trackUri: string
): Promise<Playlist[]> {
  const next = list.map((p) =>
    p.id === id
      ? {
          ...p,
          trackUris: p.trackUris.filter((u) => u !== trackUri),
          updatedAt: Date.now(),
        }
      : p
  );
  await savePlaylists(next);
  return next;
}

export async function reorderPlaylist(
  list: Playlist[],
  id: string,
  from: number,
  to: number
): Promise<Playlist[]> {
  const next = list.map((p) => {
    if (p.id !== id) return p;
    const uris = [...p.trackUris];
    const [moved] = uris.splice(from, 1);
    uris.splice(to, 0, moved);
    return { ...p, trackUris: uris, updatedAt: Date.now() };
  });
  await savePlaylists(next);
  return next;
}