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
import { useHover } from '../hooks/useHover';
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
  const upNextStart = queueIndex + 1;
  const upNext = queue.slice(upNextStart, upNextStart + UP_NEXT_PREVIEW);

  const jumpToUpNext = async (localIndex: number) => {
    await playQueue(queue, upNextStart + localIndex);
  };

  const queuePosition = queue.length > 0 ? queueIndex + 1 : 0;
  const hasMoreAfterPreview = queue.length > UP_NEXT_PREVIEW + 1;

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
              <MenuButton
                onPress={() => setActionSong(currentTrack)}
                colors={colors}
              />
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
              <TransportButton
                icon="shuffle"
                size={18}
                onPress={toggleShuffle}
                color={shuffle ? colors.primary : colors.iconMuted}
                colors={colors}
              />

              <TransportButton
                icon="skip-back"
                size={24}
                onPress={previous}
                color={colors.icon}
                colors={colors}
                wide
              />

              <PlayPauseButton
                isPlaying={isPlaying}
                onPress={togglePlayPause}
                colors={colors}
              />

              <TransportButton
                icon="skip-forward"
                size={24}
                onPress={next}
                color={colors.icon}
                colors={colors}
                wide
              />

              <TransportButton
                icon="repeat"
                size={18}
                onPress={cycleRepeat}
                color={
                  repeatMode !== 'off' ? colors.primary : colors.iconMuted
                }
                colors={colors}
              >
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
              </TransportButton>
            </View>

            <FullPlayerButton
              onPress={() => router.push('/player')}
              colors={colors}
              design={design}
            />

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
                  <UpNextRow
                    key={`${song.id}-${idx}`}
                    song={song}
                    onPress={() => jumpToUpNext(idx)}
                    colors={colors}
                    design={design}
                  />
                ))}

                {hasMoreAfterPreview && (
                  <SeeQueueLink
                    onPress={() => setQueueOpen(true)}
                    colors={colors}
                    design={design}
                  />
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

// ── Transport button ────────────────────────────────────
// Small icon buttons: shuffle, prev, next, repeat. Each holds
// its own hover state, so this has to be its own component —
// calling useHover four times inline in NowPlayingAside would
// be legal but ugly.
function TransportButton({
  icon,
  size,
  onPress,
  color,
  colors,
  wide,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  size: number;
  onPress: () => void;
  color: string;
  colors: any;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      hitSlop={8}
      style={[
        wide ? styles.ctrlBtn : styles.smallBtn,
        hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Feather name={icon} size={size} color={color} />
      {children}
    </Pressable>
  );
}

// ── Play / pause button ─────────────────────────────────
function PlayPauseButton({
  isPlaying,
  onPress,
  colors,
}: {
  isPlaying: boolean;
  onPress: () => void;
  colors: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.playBtn,
        { backgroundColor: colors.primary },
        hovered && { opacity: 0.9 },
      ]}
    >
      <Feather
        name={isPlaying ? 'pause' : 'play'}
        size={26}
        color={colors.primaryText}
        style={{ marginLeft: isPlaying ? 0 : 3 }}
      />
    </Pressable>
  );
}

// ── Menu (3-dot) button ─────────────────────────────────
function MenuButton({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      hitSlop={10}
      style={[
        styles.menuBtn,
        hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Feather name="more-vertical" size={20} color={colors.iconMuted} />
    </Pressable>
  );
}

// ── Full player button ──────────────────────────────────
function FullPlayerButton({
  onPress,
  colors,
  design,
}: {
  onPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={({ pressed }) => [
        styles.openFullBtn,
        {
          borderColor: colors.border,
          borderRadius: design.radius.item,
        },
        hovered && { backgroundColor: colors.surfaceElevated },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Feather name="maximize-2" size={16} color={colors.textSecondary} />
      <Text
        style={[
          design.type.caption,
          { color: colors.textSecondary, fontWeight: '600' },
        ]}
      >
        Open full player
      </Text>
    </Pressable>
  );
}

// ── Up-next row ─────────────────────────────────────────
function UpNextRow({
  song,
  onPress,
  colors,
  design,
}: {
  song: Song;
  onPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.upNextRow,
        hovered && { backgroundColor: colors.surfaceElevated },
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
          <Feather name="music" size={14} color={colors.iconMuted} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.text, fontWeight: '600', fontSize: 13 },
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
  );
}

// ── See full queue link ─────────────────────────────────
function SeeQueueLink({
  onPress,
  colors,
  design,
}: {
  onPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.seeQueueBtn,
        hovered && { backgroundColor: colors.surfaceElevated },
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
      <Feather name="chevron-right" size={14} color={colors.primary} />
    </Pressable>
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
    borderRadius: 14,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderRadius: 10,
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
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
});