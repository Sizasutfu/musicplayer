// hooks/useRecentlyAdded.ts
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song } from './useLibrary';

const KEY = 'library:firstSeen:v1';

// Only tracks seen in the last 30 days count as "recently added".
// After that the section just stops showing — a track added two
// months ago isn't new to anyone.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type SeenMap = Record<string, number>;

async function loadSeen(): Promise<SeenMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: SeenMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && v > 0) out[k] = v;
    }
    return out;
  } catch (e) {
    console.warn('[RecentlyAdded] failed to load:', e);
    return {};
  }
}

async function saveSeen(map: SeenMap) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[RecentlyAdded] failed to save:', e);
  }
}

/**
 * Returns the songs whose first appearance in the library is
 * within the last 30 days, newest first, joined back to the live
 * Song objects. Songs that disappear from the library are dropped
 * from the tracking map on the next pass.
 *
 * The first time the app sees a given song ID, it stamps "now".
 * On a fresh install with an empty library this is a no-op; the
 * moment the user adds files, they all get stamped together, which
 * is correct — they really were all just added.
 */
export function useRecentlyAdded(
  songs: Song[]
): Array<{ song: Song; addedAt: number }> {
  const [seen, setSeen] = useState<SeenMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSeen().then((m) => {
      if (cancelled) return;
      setSeen(m);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge new IDs and prune dead ones. Keyed on `songs` only —
  // `seen` is read via the functional updater so this effect
  // doesn't loop.
  useEffect(() => {
    if (!hydrated) return;
    if (!songs.length) return;

    setSeen((prev) => {
      let changed = false;
      const next: SeenMap = { ...prev };
      const now = Date.now();
      const liveIds = new Set(songs.map((s) => s.id));

      for (const s of songs) {
        if (!(s.id in next)) {
          next[s.id] = now;
          changed = true;
        }
      }
      for (const id of Object.keys(next)) {
        if (!liveIds.has(id)) {
          delete next[id];
          changed = true;
        }
      }

      if (changed) {
        saveSeen(next);
        return next;
      }
      return prev;
    });
  }, [songs, hydrated]);

  return useMemo(() => {
    if (!hydrated) return [];
    const cutoff = Date.now() - WINDOW_MS;

    const byId = new Map(songs.map((s) => [s.id, s]));
    const out: Array<{ song: Song; addedAt: number }> = [];

    for (const [id, at] of Object.entries(seen)) {
      if (at < cutoff) continue;
      const song = byId.get(id);
      if (song) out.push({ song, addedAt: at });
    }

    out.sort((a, b) => b.addedAt - a.addedAt);
    return out;
  }, [seen, songs, hydrated]);
}