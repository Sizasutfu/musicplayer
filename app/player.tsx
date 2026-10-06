// app/player.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { likeKey } from '../lib/circle';
import SeekBar from '../components/SeekBar';
import LikeButton from '../components/LikeButton';
import WaveformVisualizer from '../components/WaveformVisualizer';

// Same content cap as the home screen so the player stays consistent
// with the rest of the app on wide viewports.
const CONTENT_MAX_WIDTH = 720;

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// ── Wall-clock position tracker ──────────────────────────
// Tracks playback time using only the system clock. Never reads
// from the audio player during playback, which avoids the jitter
// in expo-audio's position reporting.
//
// The clock only runs while audio is actually advancing, i.e.
// playing AND not buffering. That keeps it honest for streamed
// tracks (startup delay, stalls, seeks that need a re-fetch)
// without reading the player's position.
type PositionState = {
  trackId: string | undefined;
  baseSeconds: number;
  segmentStart: number;
  wasPlaying: boolean;
};

export default function PlayerScreen() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    progress,
    togglePlayPause,
    next,
    previous,
    seekTo,
    shuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();
  const { colors, design } = useTheme();

  // ── Responsive ─────────────────────────────────────────
  // Compact: phone portrait — unchanged from before.
  // Medium:  phone landscape / small tablet — bigger art, roomier
  //          transport row.
  // Wide:    tablet landscape / desktop browser — art caps out,
  //          whole player centers in a max-width column.
  const { width, height } = useWindowDimensions();
  const isCompact = width < 500;
  const isMedium = width >= 500 && width < 900;
  const isWide = width >= 900;

  // Cap art by both width and height so tall-but-narrow windows
  // don't push the controls off-screen.
  const artSize = useMemo(() => {
    if (isCompact) return Math.min(width - 64, 340);
    if (isMedium) return Math.min(width - 160, 400, height * 0.45);
    return Math.min(440, height * 0.5);
  }, [isCompact, isMedium, width, height]);

  const hPad = isWide ? 32 : 24;
  const scrollMaxWidth = isWide ? CONTENT_MAX_WIDTH : width;

  const [seeking, setSeeking] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [displaySecond, setDisplaySecond] = useState(0);

  const effectivePlaying = isPlaying && !isBuffering;

  const stateRef = useRef<PositionState>({
    trackId: undefined,
    baseSeconds: 0,
    segmentStart: Date.now(),
    wasPlaying: false,
  });

  // ── Anchor management ──────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    const now = Date.now();

    if (currentTrack?.id !== s.trackId) {
      s.trackId = currentTrack?.id;
      s.baseSeconds = 0;
      s.segmentStart = now;
      s.wasPlaying = effectivePlaying;
      setDisplaySecond(0);
      return;
    }

    if (effectivePlaying !== s.wasPlaying) {
      if (effectivePlaying) {
        s.segmentStart = now;
      } else {
        s.baseSeconds += (now - s.segmentStart) / 1000;
      }
      s.wasPlaying = effectivePlaying;
    }
  }, [currentTrack?.id, effectivePlaying]);

  // ── Wall-clock ticker ──────────────────────────────────
  useEffect(() => {
    if (!effectivePlaying || seeking) return;

    const id = setInterval(() => {
      const s = stateRef.current;
      const elapsed = (Date.now() - s.segmentStart) / 1000;
      setDisplaySecond(Math.floor(s.baseSeconds + elapsed));
    }, 250);

    return () => clearInterval(id);
  }, [effectivePlaying, seeking]);

  const displayPosition = seeking ? scrubPosition : displaySecond;
  const duration = currentTrack?.duration ?? progress.duration ?? 0;

  const artwork = (currentTrack as any)?.artwork as string | undefined;

  const handleSeek = (seconds: number) => {
    setSeekTo(seconds);
  };

  const setSeekTo = async (seconds: number) => {
    const s = stateRef.current;
    s.baseSeconds = seconds;
    s.segmentStart = Date.now();
    setScrubPosition(seconds);
    setDisplaySecond(Math.floor(seconds));
    await seekTo(seconds);
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isWide ? 24 : 16 }]}>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.headerBtn}>
          <Feather name="chevron-down" size={26} color={colors.icon} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text
            style={[
              design.type.sectionLabel,
              { color: colors.textMuted, fontSize: 10 },
            ]}
          >
            NOW PLAYING
          </Text>
          <Text
            style={[
              design.type.caption,
              {
                color: colors.text,
                fontWeight: '700',
                maxWidth: 200,
              },
            ]}
            numberOfLines={1}
          >
            {currentTrack?.album || 'Library'}
          </Text>
        </View>
        <Pressable hitSlop={10} style={styles.headerBtn}>
          <Feather name="more-horizontal" size={24} color={colors.icon} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: hPad,
            maxWidth: scrollMaxWidth,
            alignSelf: isWide ? 'center' : 'stretch',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Album art + waveform */}
        <View style={styles.artWrap}>
          <View
            style={[
              styles.art,
              {
                width: artSize,
                height: artSize,
                backgroundColor: colors.artPlaceholder,
                borderRadius: design.radius.card + 6,
              },
            ]}
          >
            {artwork ? (
              <Image
                source={{ uri: artwork }}
                style={styles.artImage}
                resizeMode="cover"
              />
            ) : (
              <Feather name="music" size={72} color={colors.iconMuted} />
            )}

            <View style={styles.waveWrap} pointerEvents="none">
              <WaveformVisualizer
                playing={effectivePlaying}
                color={colors.primary}
                height={72}
                opacity={0.9}
              />
            </View>
          </View>
        </View>

        {/* Track info + heart */}
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[design.type.title, { color: colors.text }]}
            >
              {currentTrack?.title || 'Nothing playing'}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                design.type.body,
                { color: colors.textSecondary, marginTop: 4 },
              ]}
            >
              {currentTrack?.artist || '—'}
            </Text>
          </View>

          {currentTrack ? (
            <LikeButton uri={likeKey(currentTrack)} size={26} hitSlop={10} />
          ) : (
            <View style={styles.likePlaceholder} />
          )}
        </View>

        {/* Seek bar */}
        <View style={styles.seekWrap}>
          <SeekBar
            position={displayPosition}
            duration={duration}
            onSeek={handleSeek}
            onSeekingChange={setSeeking}
          />
          <View style={styles.timeRow}>
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textMuted,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {formatTime(displayPosition)}
            </Text>
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textMuted,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Transport controls */}
        <View
          style={[
            styles.controls,
            {
              paddingHorizontal: isWide ? 32 : 8,
              gap: isWide ? 24 : 0,
            },
          ]}
        >
          <Pressable
            onPress={toggleShuffle}
            hitSlop={10}
            style={styles.smallBtn}
          >
            <Feather
              name="shuffle"
              size={22}
              color={shuffle ? colors.primary : colors.iconMuted}
            />
            {shuffle && (
              <View
                style={[styles.activeDot, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>

          <Pressable hitSlop={10} style={styles.smallBtn} onPress={previous}>
            <Feather name="skip-back" size={30} color={colors.icon} />
          </Pressable>

          <Pressable
            onPress={togglePlayPause}
            style={[
              styles.playBtn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.fabShadow,
              },
            ]}
            hitSlop={6}
          >
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={34}
              color={colors.primaryText}
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </Pressable>

          <Pressable hitSlop={10} style={styles.smallBtn} onPress={next}>
            <Feather name="skip-forward" size={30} color={colors.icon} />
          </Pressable>

          <Pressable
            onPress={cycleRepeat}
            hitSlop={10}
            style={styles.smallBtn}
          >
            <Feather
              name="repeat"
              size={22}
              color={repeatMode !== 'off' ? colors.primary : colors.iconMuted}
            />
            {repeatMode === 'one' && (
              <View
                style={[
                  styles.repeatBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.repeatBadgeText}>1</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Bottom row */}
        <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
          <Pressable hitSlop={8} style={styles.bottomBtn}>
            <Feather name="speaker" size={20} color={colors.icon} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.bottomBtn}>
            <Feather name="list" size={20} color={colors.icon} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 32,
  },

  artWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  artImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  waveWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  likePlaceholder: { width: 26, height: 26 },

  seekWrap: { marginBottom: 8 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 32,
  },
  smallBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  repeatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomBtn: {
    padding: 12,
  },
});