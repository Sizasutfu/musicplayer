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
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song } from './LibraryContext';

export type RepeatMode = 'off' | 'all' | 'one';

type PlayerContextValue = {
  ready: boolean;
  currentTrack: Song | undefined;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  /** True while the player is waiting for data (streams, seeks on streams). */
  isBuffering: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  progress: { position: number; duration: number; buffered: number };
  playTrack: (track: Song, queue?: Song[]) => Promise<void>;
  playQueue: (queue: Song[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ── Persisted preferences ──────────────────────────────────
// Only shuffle + repeatMode are persisted. shuffleOrder is
// deliberately NOT persisted: it's an index array into the queue,
// and the queue doesn't survive a restart — it's rebuilt from
// whatever the user picks next. startQueue regenerates the order
// from the shuffle flag, so restoring the flag is sufficient.
type PlayerPrefs = {
  shuffle: boolean;
  repeatMode: RepeatMode;
};

const DEFAULT_PREFS: PlayerPrefs = {
  shuffle: false,
  repeatMode: 'off',
};

const PREFS_KEY = 'player:prefs:v1';

async function loadPlayerPrefs(): Promise<PlayerPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw);
    return {
      shuffle:
        typeof parsed?.shuffle === 'boolean'
          ? parsed.shuffle
          : DEFAULT_PREFS.shuffle,
      repeatMode:
        parsed?.repeatMode === 'off' ||
        parsed?.repeatMode === 'all' ||
        parsed?.repeatMode === 'one'
          ? parsed.repeatMode
          : DEFAULT_PREFS.repeatMode,
    };
  } catch (e) {
    console.warn('[Player] failed to load prefs:', e);
    return DEFAULT_PREFS;
  }
}

async function savePlayerPrefs(prefs: PlayerPrefs) {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[Player] failed to save prefs:', e);
  }
}

// ── Shuffle helper ─────────────────────────────────────────
// Fisher-Yates shuffle over an index array, then move the
// currently-playing index to position 0 so we don't jump tracks
// the moment shuffle is enabled.
function buildShuffleOrder(length: number, startAt: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const pos = indices.indexOf(startAt);
  if (pos > 0) {
    indices.splice(pos, 1);
    indices.unshift(startAt);
  }
  return indices;
}

// ── Artwork URL validation ─────────────────────────────────
// Android's setActiveForLockScreen only accepts http(s):// or
// file:// URLs. Base64 data URIs throw MalformedURLException, so
// we check before passing them through.
function isUsableArtworkUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://')
  );
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<Song | undefined>();
  const [ready, setReady] = useState(false);

  const [shuffle, setShuffle] = useState(DEFAULT_PREFS.shuffle);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(
    DEFAULT_PREFS.repeatMode
  );
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  // Gate writes until we've read what was stored. Without this the
  // persist effect below would run on the first render with defaults
  // and overwrite the saved values before the load resolves.
  const [prefsHydrated, setPrefsHydrated] = useState(false);

  // ── Audio session config ────────────────────────────────
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => setReady(true))
      .catch((e) => {
        console.warn('[Player] setAudioMode failed:', e);
        setReady(true);
      });
  }, []);

  // ── Hydrate persisted prefs once on mount ───────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const prefs = await loadPlayerPrefs();
      if (cancelled) return;

      setShuffle(prefs.shuffle);
      setRepeatMode(prefs.repeatMode);
      setPrefsHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Persist prefs whenever either value changes ─────────
  useEffect(() => {
    if (!prefsHydrated) return;
    savePlayerPrefs({ shuffle, repeatMode });
  }, [shuffle, repeatMode, prefsHydrated]);

  // ── Low-level: swap the track on the player ─────────────
  const loadIntoPlayer = useCallback(
    (song: Song) => {
      player.replace({ uri: song.url });
      player.play();

      try {
        const artworkIsUsable = isUsableArtworkUrl(song.artwork);

        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album ?? '',
          // Only include artworkUrl when it's a real URL. Base64 data
          // URIs break Android's URL parser, and passing nothing falls
          // back to the app icon.
          ...(artworkIsUsable ? { artworkUrl: song.artwork } : {}),
        });
      } catch (e) {
        console.warn('[Player] setActiveForLockScreen failed:', e);
      }
    },
    [player]
  );

  // ── High-level: start a new queue ───────────────────────
  const startQueue = useCallback(
    async (list: Song[], index: number) => {
      const song = list[index];
      if (!song) return;
      setQueue(list);
      setQueueIndex(index);
      setCurrentTrack(song);

      if (shuffle) {
        setShuffleOrder(buildShuffleOrder(list.length, index));
      }

      loadIntoPlayer(song);
    },
    [shuffle, loadIntoPlayer]
  );

  // ── Advance within the existing queue ───────────────────
  const advanceTo = useCallback(
    async (index: number) => {
      const song = queue[index];
      if (!song) return;
      setQueueIndex(index);
      setCurrentTrack(song);
      loadIntoPlayer(song);
    },
    [queue, loadIntoPlayer]
  );

  const playQueue = useCallback(
    async (list: Song[], startIndex = 0) => {
      if (!list.length) return;
      const idx = Math.max(0, Math.min(startIndex, list.length - 1));
      await startQueue(list, idx);
    },
    [startQueue]
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

  // ── Next ────────────────────────────────────────────────
  const next = useCallback(async () => {
    if (!queue.length) return;

    let nextIndex: number;

    if (shuffle && shuffleOrder.length) {
      const pos = shuffleOrder.indexOf(queueIndex);
      const nextPos = pos + 1;
      if (nextPos >= shuffleOrder.length) {
        if (repeatMode === 'all') {
          nextIndex = shuffleOrder[0];
        } else {
          player.pause();
          return;
        }
      } else {
        nextIndex = shuffleOrder[nextPos];
      }
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          player.pause();
          return;
        }
      }
    }

    await advanceTo(nextIndex);
  }, [queue, queueIndex, shuffle, shuffleOrder, repeatMode, advanceTo, player]);

  // ── Previous ────────────────────────────────────────────
  const previous = useCallback(async () => {
    if (!queue.length) return;

    // Standard behavior: if we're past 3s, restart the current track.
    if ((status.currentTime ?? 0) > 3) {
      await player.seekTo(0);
      return;
    }

    let prevIndex: number;

    if (shuffle && shuffleOrder.length) {
      const pos = shuffleOrder.indexOf(queueIndex);
      const prevPos = pos - 1;
      if (prevPos < 0) {
        if (repeatMode === 'all') {
          prevIndex = shuffleOrder[shuffleOrder.length - 1];
        } else {
          await player.seekTo(0);
          return;
        }
      } else {
        prevIndex = shuffleOrder[prevPos];
      }
    } else {
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1;
        } else {
          await player.seekTo(0);
          return;
        }
      }
    }

    await advanceTo(prevIndex);
  }, [
    queue,
    queueIndex,
    shuffle,
    shuffleOrder,
    repeatMode,
    status.currentTime,
    advanceTo,
    player,
  ]);

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

  // ── Auto-advance on finish ──────────────────────────────
  useEffect(() => {
    if (!status.didJustFinish) return;

    if (repeatMode === 'one') {
      player.seekTo(0);
      player.play();
      return;
    }

    next();
  }, [status.didJustFinish, repeatMode, next, player]);

  // ── Shuffle toggle ──────────────────────────────────────
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const nextVal = !prev;
      if (nextVal && queue.length > 0 && queueIndex >= 0) {
        setShuffleOrder(buildShuffleOrder(queue.length, queueIndex));
      } else {
        setShuffleOrder([]);
      }
      return nextVal;
    });
  }, [queue.length, queueIndex]);

  // ── Repeat cycle: off → all → one → off ─────────────────
  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'
    );
  }, []);

  const isPlaying = status.playing ?? false;
  const isBuffering = status.isBuffering ?? false;

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready,
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isBuffering,
      shuffle,
      repeatMode,
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
      toggleShuffle,
      cycleRepeat,
    }),
    [
      ready,
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isBuffering,
      shuffle,
      repeatMode,
      status.currentTime,
      status.duration,
      playTrack,
      playQueue,
      togglePlayPause,
      next,
      previous,
      seekTo,
      toggleShuffle,
      cycleRepeat,
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