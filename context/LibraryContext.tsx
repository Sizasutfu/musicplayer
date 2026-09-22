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
import * as MediaLibrary from 'expo-media-library';
import type { Track } from 'react-native-track-player';
import {
  type TrackMetadata,
  mergeMetadata,
  readTags,
  getCached,
  setCached,
} from '../lib/metadata';

export type Song = Track & TrackMetadata & {
  id: string;
  url: string;
  filename: string;
};

type LibraryContextValue = {
  songs: Song[];
  loading: boolean;
  granting: boolean;
  enriching: boolean;
  granted: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelled = useRef(false);

  const load = useCallback(async () => {
    // Cancel any in-flight load
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
        setSongs([]);
        setLoading(false);
        return;
      }
      if (cancelled.current) return;
      setGranted(true);

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: [MediaLibrary.SortBy.default],
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
      setSongs(fast);
      setLoading(false);
      setEnriching(true);

      // Step 2: apply cached metadata first
      const withCache: Song[] = await Promise.all(
        fast.map(async (s) => {
          const cached = await getCached(s.url);
          return cached ? { ...s, ...cached } : s;
        })
      );

      if (cancelled.current) return;
      setSongs(withCache);

      // Step 3: extract ID3 tags for uncached tracks
      const uncached = withCache.filter(
        (s) => !s.artwork && s.artist === 'Unknown Artist'
      );

      for (const song of uncached) {
        if (cancelled.current) return;

        const tags = await readTags(song.url);
        const merged = mergeMetadata(song.filename, tags);

        await setCached(song.url, merged);

        if (cancelled.current) return;
        setSongs((prev) =>
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

  const value = useMemo<LibraryContextValue>(
    () => ({
      songs,
      loading,
      granting,
      enriching,
      granted,
      error,
      refresh: load,
    }),
    [songs, loading, granting, enriching, granted, error, load]
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

// Re-export Song type so old imports still work
export type { Song as LibrarySong };