// lib/webLibrary.ts
import type { Song } from '../context/LibraryContext';

const API_BASE = process.env.EXPO_PUBLIC_CIRCLE_API_URL;

/**
 * Raw shape returned by GET /api/tracks.
 *
 * Response envelope:
 *   { success, message, data: { hasMore, limit, page, tracks: [...] } }
 *
 * Each track (only the fields we know for sure — the API may return
 * more, and unknown fields are ignored by design):
 */
type ApiTrack = {
  id: number | string;
  userId?: number;
  title: string;
  artist?: string;
  album?: string;
  durationSec?: number;
  // Artwork field — one of these, depending on your controller.
  // If none match, the row falls back to the placeholder icon.
  artworkUrl?: string;
  artwork?: string;
  coverUrl?: string;
  coverArt?: string;
  imageUrl?: string;
  trackNumber?: number;
  year?: number;
  originalFilename?: string;
  filename?: string;
};

function pickArtwork(t: ApiTrack): string | undefined {
  return (
    t.artworkUrl ??
    t.artwork ??
    t.coverUrl ??
    t.coverArt ??
    t.imageUrl ??
    undefined
  );
}

function streamUrlFor(id: string): string {
  return `${API_BASE}/api/tracks/${id}/stream`;
}

function toSong(t: ApiTrack): Song {
  // The API uses numeric IDs; Song.id is typed as string. Stringify
  // so downstream Map lookups and keyExtractor treat them consistently.
  const id = String(t.id);

  return {
    id,
    url: streamUrlFor(id),
    filename: t.originalFilename ?? t.filename ?? '',
    duration: t.durationSec,
    title: t.title ?? 'Untitled',
    artist: t.artist?.trim() || 'Unknown Artist',
    album: t.album?.trim() || 'Unknown Album',
    artwork: pickArtwork(t),
    trackNumber: t.trackNumber,
    year: t.year,
  };
}

export async function fetchWebLibrary(): Promise<Song[]> {
  if (!API_BASE) {
    throw new Error(
      'EXPO_PUBLIC_CIRCLE_API_URL is not set. Add it to .env.'
    );
  }

  const url = `${API_BASE}/api/tracks`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Circle API returned ${res.status} for ${url}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from ${url}, got ${contentType || 'no content type'}. ` +
        `Response starts with: ${text.slice(0, 60)}`
    );
  }

  const json = await res.json();

  // Envelope: { success, message, data: { tracks: [...] } }.
  // Accept a couple of variants in case the controller changes.
  const tracks: ApiTrack[] =
    Array.isArray(json?.data?.tracks)
      ? json.data.tracks
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json)
      ? json
      : [];

  // Log the first object once so you can see what fields actually
  // exist on your API. Remove this after confirming the mapping.
  if (tracks.length > 0) {
    console.log(
      '[webLibrary] first track keys:',
      Object.keys(tracks[0]).join(', ')
    );
    console.log(
      '[webLibrary] first track sample:',
      JSON.stringify(tracks[0]).slice(0, 400)
    );
  }

  return tracks.map(toSong);
}