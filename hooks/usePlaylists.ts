// hooks/usePlaylists.ts
import { useCallback, useEffect, useState } from 'react';
import {
  type Playlist,
  loadPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylist,
} from '../lib/playlists';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPlaylists().then((list) => {
      setPlaylists(list);
      setLoaded(true);
    });
  }, []);

  const create = useCallback(
    async (name: string) => {
      const created = await createPlaylist(playlists, name);
      setPlaylists((prev) => [...prev, created]);
      return created;
    },
    [playlists]
  );

  const remove = useCallback(
    async (id: string) => {
      const next = await deletePlaylist(playlists, id);
      setPlaylists(next);
    },
    [playlists]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const next = await renamePlaylist(playlists, id, name);
      setPlaylists(next);
    },
    [playlists]
  );

  const addTrack = useCallback(
    async (id: string, uri: string) => {
      const next = await addTrackToPlaylist(playlists, id, uri);
      setPlaylists(next);
    },
    [playlists]
  );

  const removeTrack = useCallback(
    async (id: string, uri: string) => {
      const next = await removeTrackFromPlaylist(playlists, id, uri);
      setPlaylists(next);
    },
    [playlists]
  );

  const reorder = useCallback(
    async (id: string, from: number, to: number) => {
      const next = await reorderPlaylist(playlists, id, from, to);
      setPlaylists(next);
    },
    [playlists]
  );

  return {
    playlists,
    loaded,
    create,
    remove,
    rename,
    addTrack,
    removeTrack,
    reorder,
  };
}