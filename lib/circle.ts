// lib/circle.ts
//
// Talks to the Circle backend (/api/tracks) and turns its tracks into
// the same `Song` shape the rest of the app already plays.

import { mergeMetadata } from './metadata';
import { CIRCLE_API_URL } from './config';
import type { Song } from '../context/LibraryContext';

// Shape returned by GET /api/tracks (inside `data.tracks`)
type CircleTrack = {
  id: number;
  userId: number;
  title: string;
  artist: string | null;
  durationSec: number | null;
  sizeBytes: number;
  playCount: number;
  createdAt: string;
  streamUrl: string;
};

export const CIRCLE_ID_PREFIX = 'circle-';

export function isCircleSong(song: Pick<Song, 'id'>): boolean {
  return song.id.startsWith(CIRCLE_ID_PREFIX);
}

// Key used for likes. Circle songs use their stable id, because their
// stream URL contains your PC's IP and will change (LAN IP today, a real
// domain later). Device songs keep using their file URI as before.
export function likeKey(song: Pick<Song, 'id' | 'url'>): string {
  return isCircleSong(song) ? song.id : song.url;
}

type Tags = Parameters<typeof mergeMetadata>[1];

function toSong(t: CircleTrack): Song {
  const filename = `${CIRCLE_ID_PREFIX}${t.id}`;
  const tags = {
    title: t.title,
    ...(t.artist ? { artist: t.artist } : {}),
  } as Tags;

  return {
    id: filename,
    // Built from our configured base URL so it always matches what the
    // phone can actually reach.
    url: `${CIRCLE_API_URL}/api/tracks/${t.id}/stream`,
    filename,
    duration: t.durationSec ?? undefined,
    ...mergeMetadata(filename, tags),
  };
}

export async function fetchCircleTracks(signal?: AbortSignal): Promise<Song[]> {
  const songs: Song[] = [];
  let page = 1;

  // Pages of 50, capped at 20 pages (1000 tracks) like the device library.
  while (page <= 20) {
    const res = await fetch(
      `${CIRCLE_API_URL}/api/tracks?page=${page}&limit=50`,
      { signal }
    );

    if (!res.ok) {
      throw new Error(`Circle server responded with ${res.status}`);
    }

    const json = await res.json();
    const data = json?.data;
    const tracks: CircleTrack[] = Array.isArray(data?.tracks) ? data.tracks : [];

    songs.push(...tracks.map(toSong));

    if (!data?.hasMore) break;
    page += 1;
  }

  return songs;
}