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
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import {
  type TrackMetadata,
  mergeMetadata,
  readTags,
  getCached,
  setCached,
} from '../lib/metadata';
import { fetchWebLibrary } from '../lib/webLibrary';
import { useTheme } from './ThemeContext';

export type Song = TrackMetadata & {
  id: string;
  url: string;
  filename: string;
  duration?: number;
};

type LibraryContextValue = {
  songs: Song[];
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
      // ── Web path ────────────────────────────────────────
      // The browser has no access to the user's disk, so the
      // library comes from the Circle API instead. Metadata is
      // already complete in the response, so no enrichment pass
      // and no cache are needed.
      if (Platform.OS === 'web') {
        const tracks = await fetchWebLibrary();
        if (cancelled.current) return;
        setGranted(true);
        setAllSongs(tracks);
        return;
      }

      // ── Native path (unchanged) ─────────────────────────
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

  const songs = useMemo(() => {
    const min = settings.minSongDuration;
    if (!min || min <= 0) return allSongs;

    return allSongs.filter((s) => {
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