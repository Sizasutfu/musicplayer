// hooks/useLibrary.ts
import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import type { Track } from 'react-native-track-player';

export type Song = Track & {
  id: string;
  url: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
};

type State = {
  songs: Song[];
  loading: boolean;
  granted: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLibrary(): State {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        setGranted(false);
        setSongs([]);
        return;
      }
      setGranted(true);

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 500,
        sortBy: [MediaLibrary.SortBy.default],
      });

      const mapped: Song[] = assets.map((a) => ({
        id: a.id,
        url: a.uri,
        title: a.filename.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        duration: a.duration ?? undefined,
        artwork: undefined,
      }));

      setSongs(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { songs, loading, granted, error, refresh: load };
}