// context/PlayerContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
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

let isSetup = false;

async function setupPlayerOnce() {
  if (isSetup) return;
  try {
    await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
  } catch (e: any) {
    if (!e?.message?.includes('already')) throw e;
  }

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    progressUpdateEventInterval: 1,
  });

  await TrackPlayer.setRepeatMode(RepeatMode.Off);
  isSetup = true;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const activeTrack = useActiveTrack();

  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  // ── One-time setup ─────────────────────────────────────
  useEffect(() => {
    setupPlayerOnce()
      .then(() => setReady(true))
      .catch((e) => console.warn('[Player] setup failed:', e));
  }, []);

  // ── Track changes from lock screen / notification ──────
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async () => {
    try {
      const idx = await TrackPlayer.getActiveTrackIndex();
      if (typeof idx === 'number') setQueueIndex(idx);
    } catch {
      // ignore
    }
  });

  const isPlaying =
    playbackState.state === State.Playing ||
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;

  const currentTrack = (activeTrack as unknown as Song) || undefined;

  const loadAndPlay = useCallback(async (list: Song[], index: number) => {
    await TrackPlayer.reset();
    await TrackPlayer.add(list as any);
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
    setQueue(list);
    setQueueIndex(index);
  }, []);

  const playQueue = useCallback(
    async (list: Song[], startIndex = 0) => {
      if (!list.length) return;
      const idx = Math.max(0, Math.min(startIndex, list.length - 1));
      await loadAndPlay(list, idx);
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
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  }, [isPlaying]);

  const next = useCallback(async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch {
      await TrackPlayer.pause();
    }
  }, []);

  const previous = useCallback(async () => {
    try {
      const pos = await TrackPlayer.getPosition();
      if (pos > 3) {
        await TrackPlayer.seekTo(0);
        return;
      }
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, []);

  const seekTo = useCallback(async (seconds: number) => {
    try {
      await TrackPlayer.seekTo(Math.max(0, seconds));
    } catch (e) {
      console.warn('[Player] seekTo failed:', e);
    }
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready,
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      progress: {
        position: progress.position ?? 0,
        duration: progress.duration ?? currentTrack?.duration ?? 0,
        buffered: progress.buffered ?? 0,
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
      progress.position,
      progress.duration,
      progress.buffered,
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