// lib/metadata.ts
import { getAudioMetadata } from '@missingcore/audio-metadata';
import * as FileSystem from 'expo-file-system/legacy';

// ── Types ────────────────────────────────────────────────
export type TrackMetadata = {
  title: string;
  artist: string;
  album: string;
  artwork?: string;      // base64 data URI
  trackNumber?: number;
  year?: number;
  genre?: string;
};

const CACHE_DIR = FileSystem.documentDirectory + 'metadata-cache/';

// Simple string hash → safe filename
function hashUri(uri: string): string {
  let hash = 5381;
  for (let i = 0; i < uri.length; i++) {
    hash = ((hash << 5) + hash) ^ uri.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

async function ensureCacheDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch {
    // ignore — will retry on next write
  }
}

// ── Filename parser (fallback) ───────────────────────────
// Handles: "01 - Artist - Title.mp3", "Artist - Title.mp3",
//          "01 Title.mp3", "Title.mp3"
export function parseFilename(filename: string): Partial<TrackMetadata> {
  const base = filename.replace(/\.[^/.]+$/, '').trim();

  // "01 - Artist - Title"
  let m = base.match(/^(\d{1,3})\s*[-.)]\s*(.+?)\s*[-–]\s*(.+)$/);
  if (m) {
    return {
      trackNumber: parseInt(m[1], 10),
      artist: m[2].trim(),
      title: m[3].trim(),
    };
  }

  // "Artist - Title"
  m = base.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (m) {
    return { artist: m[1].trim(), title: m[2].trim() };
  }

  // "01 Title"
  m = base.match(/^(\d{1,3})\s*[-.)\s]\s*(.+)$/);
  if (m) {
    return { trackNumber: parseInt(m[1], 10), title: m[2].trim() };
  }

  return { title: base };
}

// ── Read ID3 tags from a file URI ────────────────────────
export async function readTags(uri: string): Promise<Partial<TrackMetadata>> {
  try {
    const data = await getAudioMetadata(uri, [
      'name',
      'artist',
      'album',
      'albumArtist',
      'artwork',
      'track',
      'year',
    ] as const);

    if (!data?.metadata) return {};

    const md = data.metadata as any;

    const artwork = md.artwork
      ? md.artwork.startsWith('data:')
        ? md.artwork
        : `data:image/jpeg;base64,${md.artwork}`
      : undefined;

    return {
      title: md.name || undefined,
      artist: md.artist || md.albumArtist || undefined,
      album: md.album || undefined,
      artwork,
      trackNumber: md.track ? Number(md.track) : undefined,
      year: md.year ? Number(md.year) : undefined,
    };
  } catch {
    return {};
  }
}

// ── Cache (file-system based) ────────────────────────────
export async function getCached(uri: string): Promise<TrackMetadata | null> {
  try {
    const path = CACHE_DIR + hashUri(uri) + '.json';
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as TrackMetadata;
  } catch {
    return null;
  }
}

export async function setCached(
  uri: string,
  meta: TrackMetadata
): Promise<void> {
  try {
    await ensureCacheDir();
    const path = CACHE_DIR + hashUri(uri) + '.json';
    await FileSystem.writeAsStringAsync(path, JSON.stringify(meta));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export async function clearCache(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
  } catch {
    // ignore
  }
}

// ── Merge: filename fallback + ID3 tags ─────────────────
export function mergeMetadata(
  filename: string,
  tags: Partial<TrackMetadata>
): TrackMetadata {
  const fromName = parseFilename(filename);

  return {
    title: tags.title || fromName.title || filename,
    artist: tags.artist || fromName.artist || 'Unknown Artist',
    album: tags.album || 'Unknown Album',
    artwork: tags.artwork,
    trackNumber: tags.trackNumber ?? fromName.trackNumber,
    year: tags.year,
  };
}

// ── Album grouping ───────────────────────────────────────
import type { Song } from '../hooks/useLibrary';

export type Album = {
  key: string;          // `${artist}::${album}` or `__unknown__`
  title: string;
  artist: string;
  artwork?: string;
  songs: Song[];
};

export function groupByAlbum(songs: Song[]): Album[] {
  const map = new Map<string, Album>();

  for (const s of songs) {
    const isUnknownAlbum = !s.album || s.album === 'Unknown Album';

    // Unknown albums all share one bucket so they don't fragment
    // into one tile per filename-derived artist.
    const key = isUnknownAlbum
      ? '__unknown__'
      : `${s.artist}::${s.album}`;

    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        title: isUnknownAlbum ? 'Unknown Album' : s.album,
        artist: isUnknownAlbum ? 'Various Artists' : s.artist,
        artwork: s.artwork,
        songs: [],
      };
      map.set(key, entry);
    }
    entry.songs.push(s);
    if (!entry.artwork && s.artwork) entry.artwork = s.artwork;
  }

  for (const album of map.values()) {
    album.songs.sort(
      (a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)
    );
  }

  return Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

// ── Artist grouping ──────────────────────────────────────
export type Artist = {
  key: string;          // the artist name (used as route param)
  name: string;
  artwork?: string;
  albums: Album[];
  songs: Song[];
  totalTracks: number;
};

export function groupByArtist(songs: Song[]): Artist[] {
  const map = new Map<string, Artist>();

  for (const s of songs) {
    const name = s.artist || 'Unknown Artist';
    let entry = map.get(name);
    if (!entry) {
      entry = {
        key: name,
        name,
        artwork: s.artwork,
        albums: [],
        songs: [],
        totalTracks: 0,
      };
      map.set(name, entry);
    }
    entry.songs.push(s);
    entry.totalTracks += 1;
    if (!entry.artwork && s.artwork) entry.artwork = s.artwork;
  }

  // Attach albums to each artist, skipping the merged unknown bucket
  const allAlbums = groupByAlbum(songs);
  for (const album of allAlbums) {
    if (album.key === '__unknown__') continue;
    const artist = map.get(album.artist);
    if (artist) artist.albums.push(album);
  }

  // Sort songs by album then track number
  for (const artist of map.values()) {
    artist.songs.sort((a, b) => {
      const byAlbum = (a.album || '').localeCompare(b.album || '');
      if (byAlbum !== 0) return byAlbum;
      return (a.trackNumber ?? 0) - (b.trackNumber ?? 0);
    });
    artist.albums.sort((a, b) => a.title.localeCompare(b.title));
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}