// components/NowPlayingAside.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { likeKey } from '../lib/circle';
import SeekBar from './SeekBar';
import LikeButton from './LikeButton';
import SongActionSheet from './SongActionSheet';
import QueueModal from './QueueModal';
import type { Song } from '../hooks/useLibrary';

const ASIDE_WIDTH = 320;
const ART_SIZE = 240;
const UP_NEXT_PREVIEW = 4;

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function NowPlayingAside() {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    progress,
    togglePlayPause,
    next,
    previous,
    seekTo,
    shuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    playQueue,
  } = usePlayer();
  const { colors, design } = useTheme();
  const [seeking, setSeeking] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [actionSong, setActionSong] = useState<Song | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);

  const displayPosition = seeking ? scrubPosition : progress.position;
  const duration = currentTrack?.duration ?? progress.duration ?? 0;

  const handleSeek = async (seconds: number) => {
    setScrubPosition(seconds);
    await seekTo(seconds);
  };

  const artwork = (currentTrack as any)?.artwork as string | undefined;

  // ── Up next ────────────────────────────────────────────
  // The first N tracks after the currently-playing one. When the
  // current track is last, the slice is empty and the section
  // hides entirely.
  const upNextStart = queueIndex + 1;
  const upNext = queue.slice(upNextStart, upNextStart + UP_NEXT_PREVIEW);

  const jumpToUpNext = async (localIndex: number) => {
    await playQueue(queue, upNextStart + localIndex);
  };

  const queuePosition = queue.length > 0 ? queueIndex + 1 : 0;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            design.type.sectionLabel,
            { color: colors.textMuted, fontSize: 10, paddingHorizontal: 24 },
          ]}
        >
          NOW PLAYING
        </Text>

        {currentTrack ? (
          <>
            <View style={styles.artWrap}>
              {artwork ? (
                <Image
                  source={{ uri: artwork }}
                  style={[
                    styles.art,
                    {
                      borderRadius: design.radius.card + 4,
                      backgroundColor: colors.artPlaceholder,
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.art,
                    {
                      borderRadius: design.radius.card + 4,
                      backgroundColor: colors.artPlaceholder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Feather name="music" size={64} color={colors.iconMuted} />
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.body,
                    { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {currentTrack.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {currentTrack.artist}
                </Text>
                {queue.length > 0 && (
                  <Text
                    style={[
                      design.type.caption,
                      {
                        color: colors.textMuted,
                        marginTop: 2,
                        fontSize: 11,
                        fontVariant: ['tabular-nums'],
                      },
                    ]}
                  >
                    {queuePosition} of {queue.length}
                  </Text>
                )}
              </View>
              <LikeButton uri={likeKey(currentTrack)} size={22} hitSlop={10} />
              <Pressable
                onPress={() => setActionSong(currentTrack)}
                hitSlop={10}
                style={styles.menuBtn}
              >
                <Feather
                  name="more-vertical"
                  size={20}
                  color={colors.iconMuted}
                />
              </Pressable>
            </View>

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

            <View style={styles.controls}>
              <Pressable
                onPress={toggleShuffle}
                hitSlop={8}
                style={styles.smallBtn}
              >
                <Feather
                  name="shuffle"
                  size={18}
                  color={shuffle ? colors.primary : colors.iconMuted}
                />
              </Pressable>

              <Pressable
                onPress={previous}
                hitSlop={8}
                style={styles.ctrlBtn}
              >
                <Feather name="skip-back" size={24} color={colors.icon} />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                style={[
                  styles.playBtn,
                  { backgroundColor: colors.primary },
                ]}
                hitSlop={6}
              >
                <Feather
                  name={isPlaying ? 'pause' : 'play'}
                  size={26}
                  color={colors.primaryText}
                  style={{ marginLeft: isPlaying ? 0 : 3 }}
                />
              </Pressable>

              <Pressable onPress={next} hitSlop={8} style={styles.ctrlBtn}>
                <Feather name="skip-forward" size={24} color={colors.icon} />
              </Pressable>

              <Pressable
                onPress={cycleRepeat}
                hitSlop={8}
                style={styles.smallBtn}
              >
                <Feather
                  name="repeat"
                  size={18}
                  color={
                    repeatMode !== 'off' ? colors.primary : colors.iconMuted
                  }
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

            <Pressable
              onPress={() => router.push('/player')}
              style={({ pressed }) => [
                styles.openFullBtn,
                {
                  borderColor: colors.border,
                  borderRadius: design.radius.item,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather
                name="maximize-2"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  design.type.caption,
                  { color: colors.textSecondary, fontWeight: '600' },
                ]}
              >
                Open full player
              </Text>
            </Pressable>

            {/* ── Up next ─────────────────────────────── */}
            {upNext.length > 0 && (
              <View style={styles.upNextSection}>
                <Text
                  style={[
                    design.type.sectionLabel,
                    {
                      color: colors.textMuted,
                      fontSize: 10,
                      paddingHorizontal: 24,
                      marginBottom: 4,
                    },
                  ]}
                >
                  UP NEXT
                </Text>

                {upNext.map((song, idx) => (
                  <Pressable
                    key={`${song.id}-${idx}`}
                    onPress={() => jumpToUpNext(idx)}
                    style={({ pressed }) => [
                      styles.upNextRow,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    {song.artwork ? (
                      <Image
                        source={{ uri: song.artwork }}
                        style={[
                          styles.upNextArt,
                          {
                            borderRadius: design.radius.item - 4,
                            backgroundColor: colors.artPlaceholder,
                          },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.upNextArt,
                          {
                            borderRadius: design.radius.item - 4,
                            backgroundColor: colors.artPlaceholder,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                        ]}
                      >
                        <Feather
                          name="music"
                          size={14}
                          color={colors.iconMuted}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          design.type.caption,
                          {
                            color: colors.text,
                            fontWeight: '600',
                            fontSize: 13,
                          },
                        ]}
                      >
                        {song.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          design.type.caption,
                          { color: colors.textMuted, marginTop: 1 },
                        ]}
                      >
                        {song.artist}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {queue.length > UP_NEXT_PREVIEW + 1 && (
                  <Pressable
                    onPress={() => setQueueOpen(true)}
                    style={({ pressed }) => [
                      styles.seeQueueBtn,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text
                      style={[
                        design.type.caption,
                        { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      See full queue
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Feather name="music" size={48} color={colors.iconMuted} />
            <Text
              style={[
                design.type.body,
                { color: colors.text, marginTop: 12, fontWeight: '600' },
              ]}
            >
              Nothing playing
            </Text>
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textSecondary,
                  marginTop: 4,
                  textAlign: 'center',
                  paddingHorizontal: 24,
                },
              ]}
            >
              Pick a song to start.
            </Text>
          </View>
        )}
      </ScrollView>

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />

      <QueueModal
        visible={queueOpen}
        onClose={() => setQueueOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: ASIDE_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  artWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  menuBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekWrap: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  smallBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  openFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  upNextSection: {
    marginTop: 24,
    paddingTop: 16,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  upNextArt: {
    width: 36,
    height: 36,
  },
  seeQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
});