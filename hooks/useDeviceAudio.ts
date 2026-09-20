import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';

export interface Track {
  id: string;
  filename: string;
  uri: string;
  duration: number;
}

export function useDeviceAudio() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== 'granted') {
      setPermissionGranted(false);
      setLoading(false);
      return;
    }

    setPermissionGranted(true);

    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 500,
      sortBy: MediaLibrary.SortBy.creationTime,
    });

    const mapped: Track[] = media.assets.map((asset) => ({
      id: asset.id,
      filename: asset.filename,
      uri: asset.uri,
      duration: asset.duration,
    }));

    setTracks(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  return { tracks, permissionGranted, loading, refresh: loadTracks };
}