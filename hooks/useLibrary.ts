// hooks/useLibrary.ts
import { useCallback, useEffect, useRef, useState } from 'react';
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

type State = {
  songs: Song[];
  loading: boolean;
  granting: boolean;
  enriching: boolean;   // true while metadata extraction is in progress
  granted: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLibrary(): State {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    cancelled.current = false;

    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        setGranted(false);
        setSongs([]);
        setLoading(false);
        return;
      }
      setGranted(true);
      setGranting(false);

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: [MediaLibrary.SortBy.default],
      });

      // Step 1: Build a "fast" list from what we already know
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

      setSongs(fast);
      setLoading(false);
      setEnriching(true);

      // Step 2: Load cached metadata first (fast, synchronous-ish)
      const withCache: Song[] = await Promise.all(
        fast.map(async (s) => {
          const cached = await getCached(s.url);
          return cached ? { ...s, ...cached } : s;
        })
      );
      if (cancelled.current) return;
      setSongs(withCache);

      // Step 3: Extract ID3 tags for uncached tracks, one at a time
      const uncached = withCache.filter((s) => !s.artwork && s.artist === 'Unknown Artist');

      for (const song of uncached) {
        if (cancelled.current) return;

        const tags = await readTags(song.url);
        const merged = mergeMetadata(song.filename, tags);

        // Cache it
        await setCached(song.url, merged);

        // Update state incrementally
        setSongs((prev) =>
          prev.map((p) =>
            p.id === song.id ? { ...p, ...merged } : p
          )
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

  return { songs, loading, granting, enriching, granted, error, refresh: load };
}