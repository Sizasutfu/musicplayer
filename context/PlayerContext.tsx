// context/PlayerContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
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
  isBuffering: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  /** Most-recently-played song IDs, newest first. Excludes duplicates. */
  recentIds: string[];
  /** Play count per song ID. Increments once each time a track starts. */
  playCounts: Record<string, number>;
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

// ── Persisted last-played state ────────────────────────────
type LastPlayed = {
  track: Song;
  queue: Song[];
  index: number;
};

const LAST_PLAYED_KEY = 'player:lastPlayed:v1';

async function loadLastPlayed(): Promise<LastPlayed | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PLAYED_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.track?.url) return null;
    if (!Array.isArray(parsed?.queue) || parsed.queue.length === 0) return null;

    return {
      track: parsed.track,
      queue: parsed.queue,
      index: typeof parsed.index === 'number' ? parsed.index : 0,
    };
  } catch (e) {
    console.warn('[Player] failed to load lastPlayed:', e);
    return null;
  }
}

async function saveLastPlayed(data: LastPlayed) {
  try {
    await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Player] failed to save lastPlayed:', e);
  }
}

// ── Persisted recently-played list ─────────────────────────
const RECENT_KEY = 'player:recent:v1';
const RECENT_LIMIT = 10;

async function loadRecentIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch (e) {
    console.warn('[Player] failed to load recents:', e);
    return [];
  }
}

async function saveRecentIds(ids: string[]) {
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('[Player] failed to save recents:', e);
  }
}

// ── Persisted play counts ──────────────────────────────────
const PLAYS_KEY = 'player:plays:v1';

async function loadPlayCounts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(PLAYS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && v > 0) out[k] = v;
    }
    return out;
  } catch (e) {
    console.warn('[Player] failed to load play counts:', e);
    return {};
  }
}

async function savePlayCounts(counts: Record<string, number>) {
  try {
    await AsyncStorage.setItem(PLAYS_KEY, JSON.stringify(counts));
  } catch (e) {
    console.warn('[Player] failed to save play counts:', e);
  }
}

// ── Shuffle helper ─────────────────────────────────────────
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
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

  const [hydrated, setHydrated] = useState(false);

  const currentTrackRef = useRef(currentTrack);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const hydratedRef = useRef(hydrated);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);
  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

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

  // ── Hydrate once on mount ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const prefs = await loadPlayerPrefs();
      const last = await loadLastPlayed();
      const recents = await loadRecentIds();
      const plays = await loadPlayCounts();
      if (cancelled) return;

      setShuffle(prefs.shuffle);
      setRepeatMode(prefs.repeatMode);
      setRecentIds(recents);
      setPlayCounts(plays);

      if (last) {
        const safeIndex = Math.max(
          0,
          Math.min(last.index, last.queue.length - 1)
        );

        setQueue(last.queue);
        setQueueIndex(safeIndex);
        setCurrentTrack(last.track);

        if (prefs.shuffle) {
          setShuffleOrder(buildShuffleOrder(last.queue.length, safeIndex));
        }

        // Load the source WITHOUT playing, so the play button works
        // immediately and the lock screen shows the last track. The
        // recently-played list is deliberately NOT updated here, so
        // reopening the app doesn't count as a play.
        try {
          player.replace({ uri: last.track.url });

          try {
            const artworkIsUsable = isUsableArtworkUrl(last.track.artwork);
            player.setActiveForLockScreen(true, {
              title: last.track.title,
              artist: last.track.artist,
              albumTitle: last.track.album ?? '',
              ...(artworkIsUsable ? { artworkUrl: last.track.artwork } : {}),
            });
          } catch (e) {
            console.warn('[Player] restore setActiveForLockScreen failed:', e);
          }
        } catch (e) {
          console.warn('[Player] restore replace failed:', e);
        }
      }

      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    if (!hydrated) return;
    savePlayerPrefs({ shuffle, repeatMode });
  }, [shuffle, repeatMode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveRecentIds(recentIds);
  }, [recentIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    savePlayCounts(playCounts);
  }, [playCounts, hydrated]);

  // ── Record a track as recently played ───────────────────
  const recordRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      if (prev[0] === id) return prev;
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, RECENT_LIMIT);
    });
  }, []);

  // ── Increment the play count for a track ────────────────
  // Fires once per track start, from loadIntoPlayer. Repeat-one
  // looping just seeks back to 0 without re-entering loadIntoPlayer,
  // so a looped track counts once per user-initiated start.
  const recordPlay = useCallback((id: string) => {
    setPlayCounts((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  // ── Persist last-played ─────────────────────────────────
  const persistLastPlayed = useCallback(() => {
    if (!hydratedRef.current) return;
    const track = currentTrackRef.current;
    if (!track) return;
    saveLastPlayed({
      track,
      queue: queueRef.current,
      index: queueIndexRef.current,
    });
  }, []);

  useEffect(() => {
    if (hydrated) persistLastPlayed();
  }, [currentTrack?.id, queue, queueIndex, hydrated, persistLastPlayed]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        persistLastPlayed();
      }
    });
    return () => sub.remove();
  }, [persistLastPlayed]);

  // ── Low-level: swap the track on the player ─────────────
  const loadIntoPlayer = useCallback(
    (song: Song) => {
      player.replace({ uri: song.url });
      player.play();
      recordRecent(song.id);
      recordPlay(song.id);

      try {
        const artworkIsUsable = isUsableArtworkUrl(song.artwork);
        player.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album ?? '',
          ...(artworkIsUsable ? { artworkUrl: song.artwork } : {}),
        });
      } catch (e) {
        console.warn('[Player] setActiveForLockScreen failed:', e);
      }
    },
    [player, recordRecent, recordPlay]
  );

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

  const previous = useCallback(async () => {
    if (!queue.length) return;

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

  useEffect(() => {
    if (!status.didJustFinish) return;

    if (repeatMode === 'one') {
      player.seekTo(0);
      player.play();
      return;
    }

    next();
  }, [status.didJustFinish, repeatMode, next, player]);

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
      recentIds,
      playCounts,
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
      recentIds,
      playCounts,
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