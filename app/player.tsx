// app/player.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import SeekBar from '../components/SeekBar';
import LikeButton from '../components/LikeButton';
import WaveformVisualizer from '../components/WaveformVisualizer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = Math.min(SCREEN_WIDTH - 64, 340);

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const {
    currentTrack,
    isPlaying,
    progress,
    togglePlayPause,
    next,
    previous,
    seekTo,
  } = usePlayer();
  const { colors, design } = useTheme();

  const [seeking, setSeeking] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  const displayPosition = seeking ? scrubPosition : progress.position;
  const duration = currentTrack?.duration ?? progress.duration ?? 0;

  // Artwork lives on the Song object flowing through the player context,
  // even though the stub's Track type doesn't declare it.
  const artwork = (currentTrack as any)?.artwork as string | undefined;

  const handleSeek = (seconds: number) => {
    setSeekTo(seconds);
  };

  const setSeekTo = async (seconds: number) => {
    setScrubPosition(seconds);
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
      <View style={styles.header}>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Album art with waveform overlay */}
        <View style={styles.artWrap}>
          <View
            style={[
              styles.art,
              {
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

            {/* Waveform lives at the bottom of the artwork */}
            <View style={styles.waveWrap} pointerEvents="none">
              <WaveformVisualizer
                playing={isPlaying}
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
            <LikeButton uri={currentTrack.url} size={26} hitSlop={10} />
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
        <View style={styles.controls}>
          <Pressable hitSlop={10} style={styles.smallBtn}>
            <Feather name="shuffle" size={22} color={colors.iconMuted} />
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

          <Pressable hitSlop={10} style={styles.smallBtn}>
            <Feather name="repeat" size={22} color={colors.iconMuted} />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  artWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
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
    ...StyleSheet.absoluteFillObject,
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
    paddingHorizontal: 8,
  },
  smallBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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