// lib/profile.ts
import * as FileSystem from 'expo-file-system/legacy';

export type Profile = {
  name: string;
  username: string;
  bio: string;
  avatarColor: string;
  avatarUri?: string;
  joinedAt: number;
};

export const AVATAR_COLORS = [
  '#0a63ff', // blue
  '#7c3aed', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#ef4444', // red
  '#8b5cf6', // purple
  '#90adee',
  '#90edea',
  '#93cdaa',
];

export const DEFAULT_PROFILE: Profile = {
  name: 'music lover',
  username: 'username',
  bio: 'i love music',
  avatarColor: AVATAR_COLORS[0],
  avatarUri: undefined,
  joinedAt: Date.now(),
};

const PROFILE_PATH = FileSystem.documentDirectory + 'profile.json';
const AVATAR_DIR = FileSystem.documentDirectory + 'avatars/';

export async function loadProfile(): Promise<Profile> {
  try {
    const info = await FileSystem.getInfoAsync(PROFILE_PATH);
    if (!info.exists) return DEFAULT_PROFILE;
    const raw = await FileSystem.readAsStringAsync(PROFILE_PATH);
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      PROFILE_PATH,
      JSON.stringify(profile)
    );
  } catch {
    // ignore
  }
}

export async function resetProfile(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(PROFILE_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(PROFILE_PATH, { idempotent: true });
    }
  } catch {
    // ignore
  }
}

// Get up to 2 initials from a name
export function getInitials(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Avatar file helpers ────────────────────────────────────

// Copy the picked photo into the app's document directory so it
// survives the OS purging the picker's cache directory. Returns
// the persistent URI to store in the profile.
export async function persistAvatar(sourceUri: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(AVATAR_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  }

  const ext =
    sourceUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const dest = `${AVATAR_DIR}avatar-${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

// Best-effort cleanup of a previously persisted avatar file.
// Ignores anything that isn't inside our own avatars directory,
// so a stale profile pointing at some external URI can't cause
// us to delete a file we don't own.
export async function deleteAvatarFile(uri?: string): Promise<void> {
  if (!uri) return;
  if (!uri.startsWith(AVATAR_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}