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

export type NormalizedMetadata = {
  title: string;
  artist: string;
  album: string;
  artwork?: string;
  trackNumber?: number;
  year?: number;
};

const CACHE_DIR = FileSystem.documentDirectory + 'metadata-cache/';

// ── Cache helpers ────────────────────────────────────────
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

// ── Filename normalization ──────────────────────────────

// Bitrate / quality markers — anywhere in the string.
//   (128k)  [320k]  (128kbps)  [256K]  (192 kbps)
const BITRATE_RE = /\s*[\(\[]\s*\d{1,4}\s*k(?:bps)?\s*[\)\]]/gi;

// Download-site / official-release artifacts. These are never part of
// the song title. Version / remix / feat. markers are NOT here because
// we want to keep those.
const ARTIFACT_RES: RegExp[] = [
  /\s*[\(\[]\s*official\s*(music\s*)?(audio|video|lyric[s]?\s*video)\s*[\)\]]/gi,
  /\s*[\(\[]\s*official\s*[\)\]]/gi,
  /\s*[\(\[]\s*(?:hd|hq|4k|8k)\s*[\)\]]/gi,
  /\s*[\(\[]\s*(?:audio|video)\s*[\)\]]/gi,
  /\s*[\(\[]\s*lyrics?\s*[\)\]]/gi,
  /\s*[\(\[]\s*(?:www\.|https?:\/\/)[^\)\]]+[\)\]]/gi,
  /\s*[\(\[]\s*[\w-]+\.(?:com|net|org|io|co\.za|za|xyz|mp3)[^\)\]]*[\)\]]/gi,
];

// Requires whitespace on both sides of the dash, so "Pro-Tee's" and
// "Artist-Title" don't accidentally split.
const ARTIST_SEP_RE = /^(.+?)\s+[-–—]\s+(.+)$/;

// A candidate artist that is only digits / dashes is really a track
// number, not an artist.
const PURE_NUMBER_RE = /^[\d\s\-–—.]+$/;

/**
 * Turn a raw filename into something human-readable. Strips extension,
 * underscores, bitrate markers, and download artifacts. Preserves
 * version / remix / feat. markers.
 */
export function cleanFilename(filename: string): string {
  let s = filename;

  // 1. Strip file extension
  s = s.replace(/\.[^/.]+$/, '');

  // 2. Underscores → spaces
  s = s.replace(/_/g, ' ');

  // 3. Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // 4. Strip bitrate markers
  s = s.replace(BITRATE_RE, '');

  // 5. Strip download-site / official-release artifacts
  for (const re of ARTIFACT_RES) {
    s = s.replace(re, '');
  }

  // 6. Final tidy — collapse whitespace and trim trailing junk
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[\s\-–—._]+$/, '').trim();

  return s;
}

/**
 * Extract artist + title only when there's a clear "Artist - Title"
 * pattern. Falls back to "Unknown Artist" otherwise.
 */
export function extractArtistAndTitle(cleaned: string): {
  artist: string;
  title: string;
} {
  const m = cleaned.match(ARTIST_SEP_RE);
  if (!m) return { artist: 'Unknown Artist', title: cleaned };

  const artist = m[1].trim();
  const title = m[2].trim();

  if (
    artist.length < 2 ||
    artist.length > 40 ||
    PURE_NUMBER_RE.test(artist) ||
    title.length < 1
  ) {
    return { artist: 'Unknown Artist', title: cleaned };
  }

  return { artist, title };
}

/**
 * The single entry point for turning (filename, embedded-tags) into
 * display metadata. Embedded tags always win when present; filename
 * parsing fills the gaps.
 */
export function normalizeSongMetadata(
  filename: string,
  embedded: Partial<TrackMetadata> = {}
): NormalizedMetadata {
  const cleaned = cleanFilename(filename);
  const fromFilename = extractArtistAndTitle(cleaned);

  const hasEmbeddedTitle =
    !!embedded.title && embedded.title.trim().length > 0;
  const hasEmbeddedArtist =
    !!embedded.artist && embedded.artist.trim().length > 0;

  const title = hasEmbeddedTitle
    ? embedded.title!.trim()
    : fromFilename.title || cleaned || filename;

  const artist = hasEmbeddedArtist
    ? embedded.artist!.trim()
    : fromFilename.artist;

  const album =
    embedded.album && embedded.album.trim().length > 0
      ? embedded.album.trim()
      : 'Unknown Album';

  return {
    title,
    artist: artist || 'Unknown Artist',
    album,
    artwork: embedded.artwork,
    trackNumber: embedded.trackNumber,
    year: embedded.year,
  };
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

// ── Merge: embedded tags win, filename fills gaps ───────
// Kept as a shim so existing callers (LibraryContext) don't change.
export function mergeMetadata(
  filename: string,
  tags: Partial<TrackMetadata>
): TrackMetadata {
  const n = normalizeSongMetadata(filename, tags);
  return {
    title: n.title,
    artist: n.artist,
    album: n.album,
    artwork: n.artwork,
    trackNumber: n.trackNumber,
    year: n.year,
    genre: tags.genre,
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

  return Array.from(map.values()).sort((a, b) => {
    // Push the unknown bucket to the very bottom.
    if (a.key === '__unknown__') return 1;
    if (b.key === '__unknown__') return -1;
    return a.title.localeCompare(b.title);
  });
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