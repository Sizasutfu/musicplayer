// context/PlayerContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import TrackPlayer, {
  Event,
  State,
  usePlaybackState,
  useProgress,
  useActiveTrack,
  type Track,
} from 'react-native-track-player';
import { setupPlayer } from '../lib/trackPlayer';

type PlayerContextValue = {
  ready: boolean;
  currentTrack: Track | undefined;
  isPlaying: boolean;
  progress: { position: number; duration: number; buffered: number };
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  playQueue: (queue: Track[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const playbackState = usePlaybackState();
  const progress = useProgress(250);
  const activeTrack = useActiveTrack();

  useEffect(() => {
    setupPlayer()
      .then(() => setReady(true))
      .catch((e) => console.warn('TrackPlayer setup failed', e));
  }, []);

  const isPlaying =
    playbackState.state === State.Playing ||
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;

  const playQueue = useCallback(async (queue: Track[], startIndex = 0) => {
    if (!queue.length) return;
    await TrackPlayer.reset();
    await TrackPlayer.add(queue);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
  }, []);

  const playTrack = useCallback(
    async (track: Track, queue?: Track[]) => {
      if (queue && queue.length) {
        const idx = queue.findIndex((t) => t.id === track.id);
        return playQueue(queue, idx >= 0 ? idx : 0);
      }
      await TrackPlayer.reset();
      await TrackPlayer.add(track);
      await TrackPlayer.play();
    },
    [playQueue]
  );

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  }, [isPlaying]);

  const next = useCallback(async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch {
      // no next track
    }
  }, []);

  const previous = useCallback(async () => {
    const pos = await TrackPlayer.getPosition();
    if (pos > 3) return TrackPlayer.seekTo(0);
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, []);

  const seekTo = useCallback(async (seconds: number) => {
    await TrackPlayer.seekTo(seconds);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready,
      currentTrack: activeTrack,
      isPlaying,
      progress: {
        position: progress.position,
        duration: progress.duration,
        buffered: progress.buffered,
      },
      playTrack,
      playQueue,
      togglePlayPause,
      next,
      previous,
      seekTo,
    }),
    [
      ready,
      activeTrack,
      isPlaying,
      progress,
      playTrack,
      playQueue,
      togglePlayPause,
      next,
      previous,
      seekTo,
    ]
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