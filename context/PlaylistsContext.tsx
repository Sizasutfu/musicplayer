// context/PlaylistsContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

type PlaylistsContextValue = {
  playlists: Playlist[];
  loaded: boolean;
  create: (name: string) => Promise<Playlist>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  addTrack: (id: string, uri: string) => Promise<void>;
  removeTrack: (id: string, uri: string) => Promise<void>;
  reorder: (id: string, from: number, to: number) => Promise<void>;
};

const PlaylistsContext = createContext<PlaylistsContextValue | null>(null);

export function PlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPlaylists().then((list) => {
      setPlaylists(list);
      setLoaded(true);
    });
  }, []);

  const create = useCallback(async (name: string) => {
    // Use the current state via updater to avoid stale closures
    let created: Playlist | null = null;
    setPlaylists((prev) => {
      // createPlaylist is async — but we can compute synchronously
      // and fire-and-forget the disk write.
      return prev;
    });
    // Simpler: read from the ref-like closure via functional pattern
    const current = await loadPlaylists();
    created = await createPlaylist(current, name);
    setPlaylists((prev) => [...prev, created!]);
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      deletePlaylist(prev, id).catch(() => {});
      return next;
    });
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() }
          : p
      );
      renamePlaylist(prev, id, name).catch(() => {});
      return next;
    });
  }, []);

  const addTrack = useCallback(async (id: string, uri: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        if (p.trackUris.includes(uri)) return p;
        return {
          ...p,
          trackUris: [...p.trackUris, uri],
          updatedAt: Date.now(),
        };
      });
      addTrackToPlaylist(prev, id, uri).catch(() => {});
      return next;
    });
  }, []);

  const removeTrack = useCallback(async (id: string, uri: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              trackUris: p.trackUris.filter((u) => u !== uri),
              updatedAt: Date.now(),
            }
          : p
      );
      removeTrackFromPlaylist(prev, id, uri).catch(() => {});
      return next;
    });
  }, []);

  const reorder = useCallback(
    async (id: string, from: number, to: number) => {
      setPlaylists((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          const uris = [...p.trackUris];
          const [moved] = uris.splice(from, 1);
          uris.splice(to, 0, moved);
          return { ...p, trackUris: uris, updatedAt: Date.now() };
        });
        reorderPlaylist(prev, id, from, to).catch(() => {});
        return next;
      });
    },
    []
  );

  const value = useMemo<PlaylistsContextValue>(
    () => ({
      playlists,
      loaded,
      create,
      remove,
      rename,
      addTrack,
      removeTrack,
      reorder,
    }),
    [playlists, loaded, create, remove, rename, addTrack, removeTrack, reorder]
  );

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx)
    throw new Error('usePlaylists must be used inside <PlaylistsProvider>');
  return ctx;
}