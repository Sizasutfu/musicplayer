// context/PlayerContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import type { Song } from './LibraryContext';

type PlayerContextValue = {
  ready: boolean;
  currentTrack: Song | undefined;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  progress: { position: number; duration: number; buffered: number };
  playTrack: (track: Song, queue?: Song[]) => Promise<void>;
  playQueue: (queue: Song[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<Song | undefined>();
  const [ready, setReady] = useState(false);

  // ── Configure the audio session once ────────────────────
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => setReady(true))
      .catch((e) => {
        console.warn('[Player] setAudioMode failed:', e);
        setReady(true); // still proceed, in-app playback works
      });
  }, []);

  const loadAndPlay = useCallback(
    async (song: Song, index: number, list: Song[]) => {
      try {
        setCurrentTrack(song);
        setQueueIndex(index);
        setQueue(list);
        player.replace({ uri: song.url });
        player.play();

        // Lock screen / notification metadata
        try {
          player.setActiveForLockScreen(true, {
            title: song.title,
            artist: song.artist,
            albumTitle: song.album ?? '',
            artworkUrl: song.artwork,
          });
        } catch (e) {
          // Lock screen metadata is best-effort; ignore failures
          console.warn('[Player] setActiveForLockScreen failed:', e);
        }
      } catch (e) {
        console.warn('[Player] loadAndPlay failed:', e);
      }
    },
    [player]
  );

  const playQueue = useCallback(
    async (list: Song[], startIndex = 0) => {
      if (!list.length) return;
      const idx = Math.max(0, Math.min(startIndex, list.length - 1));
      await loadAndPlay(list[idx], idx, list);
    },
    [loadAndPlay]
  );

  const playTrack = useCallback(
    async (track: Song, list?: Song[]) => {
      if (list && list.length) {
        const idx = list.findIndex((t) => t.id === track.id);
        await playQueue(list, idx >= 0 ? idx : 0);
      } else {
        await playQueue([track], 0);
      }
    },
    [playQueue]
  );

  const togglePlayPause = useCallback(async () => {
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

  const next = useCallback(async () => {
    if (!queue.length) return;
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      player.pause();
      return;
    }
    await loadAndPlay(queue[nextIndex], nextIndex, queue);
  }, [queue, queueIndex, loadAndPlay, player]);

  const previous = useCallback(async () => {
    if (!queue.length) return;

    if ((status.currentTime ?? 0) > 3) {
      await player.seekTo(0);
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      await player.seekTo(0);
      return;
    }
    await loadAndPlay(queue[prevIndex], prevIndex, queue);
  }, [queue, queueIndex, status.currentTime, loadAndPlay, player]);

  const seekTo = useCallback(
    async (seconds: number) => {
      try {
        await player.seekTo(Math.max(0, seconds));
      } catch (e) {
        console.warn('[Player] seekTo failed:', e);
      }
    },
    [player]
  );

  // Auto-advance when a track finishes
  useEffect(() => {
    if (status.didJustFinish) {
      next();
    }
  }, [status.didJustFinish, next]);

  const isPlaying = status.playing ?? false;

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready,
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      progress: {
        position: status.currentTime ?? 0,
        duration: status.duration ?? currentTrack?.duration ?? 0,
        buffered: 0,
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
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      status.currentTime,
      status.duration,
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