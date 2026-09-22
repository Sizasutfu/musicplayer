// lib/profile.ts
import * as FileSystem from 'expo-file-system/legacy';

export type Profile = {
  name: string;
  username: string;
  bio: string;
  avatarColor: string;
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
];

export const DEFAULT_PROFILE: Profile = {
  name: 'Music Lover',
  username: 'you',
  bio: 'Just here for the music.',
  avatarColor: AVATAR_COLORS[0],
  joinedAt: Date.now(),
};

const PROFILE_PATH = FileSystem.documentDirectory + 'profile.json';

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