// context/PlayerContext.stub.tsx
// Temporary stub — no native Track Player dependency.
// Swap imports back to ./PlayerContext when the native build is ready.
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
} from 'react';

export type StubTrack = {
  id: string;
  url: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
};

type PlayerContextValue = {
  ready: boolean;
  currentTrack: StubTrack | undefined;
  isPlaying: boolean;
  progress: { position: number; duration: number; buffered: number };
  playTrack: (track: StubTrack, queue?: StubTrack[]) => Promise<void>;
  playQueue: (queue: StubTrack[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<StubTrack | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);

  const playQueue = useCallback(async (queue: StubTrack[], startIndex = 0) => {
    if (!queue.length) return;
    console.log('[stub] playQueue →', queue[startIndex]?.title);
    setCurrentTrack(queue[startIndex]);
    setIsPlaying(true);
  }, []);

  const playTrack = useCallback(
    async (track: StubTrack, queue?: StubTrack[]) => {
      if (queue?.length) {
        const idx = queue.findIndex((t) => t.id === track.id);
        return playQueue(queue, idx >= 0 ? idx : 0);
      }
      console.log('[stub] playTrack →', track.title);
      setCurrentTrack(track);
      setIsPlaying(true);
    },
    [playQueue]
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready: true,
      currentTrack,
      isPlaying,
      progress: { position: 0, duration: 0, buffered: 0 },
      playTrack,
      playQueue,
      togglePlayPause: async () => {
        console.log('[stub] togglePlayPause');
        setIsPlaying((p) => !p);
      },
      next: async () => console.log('[stub] next'),
      previous: async () => console.log('[stub] previous'),
      seekTo: async (s) => console.log('[stub] seekTo', s),
    }),
    [currentTrack, isPlaying, playTrack, playQueue]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}