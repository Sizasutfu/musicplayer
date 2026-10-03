// hooks/useCircleTracks.ts
//
// Loads the Circle track list. Pass `enabled = false` until the user
// actually opens the Circle source, so the app makes no network calls
// when it is only being used as a local player.

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCircleTracks } from '../lib/circle';
import { CIRCLE_API_URL } from '../lib/config';
import type { Song } from '../context/LibraryContext';

const TIMEOUT_MS = 8000;

export function useCircleTracks(enabled: boolean) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    setLoading(true);
    setError(null);

    try {
      const list = await fetchCircleTracks(controller.signal);
      setSongs(list);
      loadedOnce.current = true;
    } catch (e: any) {
      const message: string = e?.message ?? '';
      if (message.startsWith('Circle server responded')) {
        setError(message);
      } else {
        // fetch itself failed (timeout, wrong IP, server off, firewall...)
        setError(
          `Couldn't reach ${CIRCLE_API_URL}. Is the server running, and is this phone on the same Wi-Fi as your PC?`
        );
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !loadedOnce.current) refresh();
  }, [enabled, refresh]);

  return { songs, loading, error, refresh };
}