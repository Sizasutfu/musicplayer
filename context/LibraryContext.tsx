// context/LibraryContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as MediaLibrary from 'expo-media-library/legacy';
import {
  type TrackMetadata,
  mergeMetadata,
  readTags,
  getCached,
  setCached,
} from '../lib/metadata';
import { useTheme } from './ThemeContext';

export type Song = TrackMetadata & {
  id: string;
  url: string;
  filename: string;
  duration?: number;
};

type LibraryContextValue = {
  songs: Song[];
  /** Every song from the device, unfiltered. Used for diagnostics and counts. */
  allSongs: Song[];
  loading: boolean;
  granting: boolean;
  enriching: boolean;
  granted: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useTheme();

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelled = useRef(false);

  const load = useCallback(async () => {
    cancelled.current = true;
    await new Promise((r) => setTimeout(r, 0));
    cancelled.current = false;

    setLoading(true);
    setError(null);

    try {
      const perm = await MediaLibrary.requestPermissionsAsync(
        false,
        ['audio']
      );

      if (!perm.granted) {
        if (cancelled.current) return;
        setGranted(false);
        setAllSongs([]);
        setLoading(false);
        return;
      }
      if (cancelled.current) return;
      setGranted(true);

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: ['default'],
      });

      // Step 1: fast list from filename + duration
      const fast: Song[] = assets.map((a) => {
        const fallback = mergeMetadata(a.filename, {});
        return {
          id: a.id,
          url: a.uri,
          filename: a.filename,
          duration: a.duration ?? undefined,
          ...fallback,
        };
      });

      if (cancelled.current) return;
      setAllSongs(fast);
      setLoading(false);
      setEnriching(true);

      // Step 2: apply cached metadata first, recording which IDs
      // hit the cache. The cache is keyed on the MediaLibrary asset
      // ID, which is stable across sessions and independent of any
      // URI churn.
      const cachedIds = new Set<string>();
      const withCache: Song[] = await Promise.all(
        fast.map(async (s) => {
          const cached = await getCached(s.id);
          if (cached) {
            cachedIds.add(s.id);
            return { ...s, ...cached };
          }
          return s;
        })
      );

      if (cancelled.current) return;
      setAllSongs(withCache);

      // Step 3: extract ID3 tags for tracks that were NOT in the
      // cache. A track that was cached is trusted as-is — even if
      // its metadata looks empty, because we already tried once and
      // there's nothing more to read. This is what prevents the
      // "reads tags every launch" loop: a file with no artist tag
      // and no artwork gets cached with `Unknown Artist` and never
      // re-read.
      const uncached = withCache.filter((s) => !cachedIds.has(s.id));

      for (const song of uncached) {
        if (cancelled.current) return;

        const tags = await readTags(song.url);
        const merged = mergeMetadata(song.filename, tags);

        await setCached(song.id, merged);

        if (cancelled.current) return;
        setAllSongs((prev) =>
          prev.map((p) => (p.id === song.id ? { ...p, ...merged } : p))
        );
      }
    } catch (e: any) {
      if (!cancelled.current) {
        setError(e?.message ?? 'Failed to load library');
      }
    } finally {
      if (!cancelled.current) {
        setLoading(false);
        setEnriching(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      cancelled.current = true;
    };
  }, [load]);

  // ── Filter applied on top of the raw list ────────────────
  // Pure derivation — changing the setting in Settings re-runs
  // this without rescanning the device.
  const songs = useMemo(() => {
    const min = settings.minSongDuration;
    if (!min || min <= 0) return allSongs;

    return allSongs.filter((s) => {
      // Keep songs with unknown duration — we can't know if they're short.
      if (s.duration === undefined || s.duration === null) return true;
      return s.duration >= min;
    });
  }, [allSongs, settings.minSongDuration]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      songs,
      allSongs,
      loading,
      granting,
      enriching,
      granted,
      error,
      refresh: load,
    }),
    [songs, allSongs, loading, granting, enriching, granted, error, load]
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx)
    throw new Error('useLibrary must be used inside <LibraryProvider>');
  return ctx;
}

export type { Song as LibrarySong };