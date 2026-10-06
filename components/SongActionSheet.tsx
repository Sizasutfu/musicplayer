// components/SongActionSheet.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayer } from '../context/PlayerContext';
import { useHover } from '../hooks/useHover';
import type { Song } from '../hooks/useLibrary';
import AddToPlaylistSheet from './AddToPlaylistSheet';

// On wide viewports the sheet caps at this width and centers.
// Full-width on phones.
const SHEET_MAX_WIDTH = 480;

type ExtraAction = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  extraActions?: ExtraAction[];
};

export default function SongActionSheet({
  visible,
  song,
  onClose,
  extraActions,
}: Props) {
  const { colors, design } = useTheme();
  const { favorites, toggle } = useFavorites();
  const { playNext, addToQueue } = usePlayer();
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const { width } = useWindowDimensions();
  const sheetWidth = Math.min(width, SHEET_MAX_WIDTH);
  const centerLeft = (width - sheetWidth) / 2;

  const close = () => {
    setPlaylistOpen(false);
    onClose();
  };

  const isFavorite = !!song && favorites.includes(song.url);

  const handleToggleFavorite = () => {
    if (!song) return;
    toggle(song.url);
    close();
  };

  const handlePlayNext = () => {
    if (!song) return;
    playNext(song);
    Alert.alert(
      'Playing next',
      `"${song.title}" will play after the current track.`
    );
    close();
  };

  const handleAddToQueue = () => {
    if (!song) return;
    addToQueue(song);
    Alert.alert(
      'Added to queue',
      `"${song.title}" added to the end of the queue.`
    );
    close();
  };

  return (
    <>
      <Modal
        visible={visible && !playlistOpen}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={close} />

          <SafeAreaView
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                width: sheetWidth,
                left: centerLeft,
                borderRadius: 20,
              },
            ]}
            edges={['bottom']}
          >
            <View style={styles.handleWrap}>
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
            </View>

            {song && (
              <View
                style={[
                  styles.songHeader,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.body,
                    { color: colors.text, fontWeight: '700', fontSize: 16 },
                  ]}
                >
                  {song.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {song.artist}
                </Text>
              </View>
            )}

            {song && (
              <ActionRow
                icon="heart"
                label={
                  isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                iconFilled={isFavorite}
                onPress={handleToggleFavorite}
                colors={colors}
                design={design}
              />
            )}
            <ActionRow
              icon="plus-circle"
              label="Add to playlist"
              onPress={() => setPlaylistOpen(true)}
              colors={colors}
              design={design}
            />
            <ActionRow
              icon="play-circle"
              label="Play next"
              onPress={handlePlayNext}
              colors={colors}
              design={design}
            />
            <ActionRow
              icon="list"
              label="Add to queue"
              onPress={handleAddToQueue}
              colors={colors}
              design={design}
              last={!extraActions || extraActions.length === 0}
            />

            {extraActions?.map((action, i) => (
              <ActionRow
                key={action.label}
                icon={action.icon}
                label={action.label}
                onPress={() => {
                  action.onPress();
                  close();
                }}
                destructive={action.destructive}
                colors={colors}
                design={design}
                last={i === extraActions.length - 1}
              />
            ))}

            <CancelRow
              onPress={close}
              colors={colors}
              design={design}
            />
          </SafeAreaView>
        </View>
      </Modal>

      <AddToPlaylistSheet
        visible={playlistOpen}
        song={song}
        onClose={close}
      />
    </>
  );
}

// ── Action row ──────────────────────────────────────────
function ActionRow({
  icon,
  label,
  onPress,
  colors,
  design,
  destructive,
  iconFilled,
  last,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  colors: any;
  design: any;
  destructive?: boolean;
  iconFilled?: boolean;
  last?: boolean;
}) {
  const { hovered, hoverProps } = useHover();

  const iconColor = destructive ? colors.danger : colors.primary;

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.row,
        !last && {
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: destructive
              ? 'rgba(239,68,68,0.12)'
              : colors.rowActive,
            borderRadius: design.radius.item - 2,
          },
        ]}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text
        style={[
          design.type.body,
          {
            flex: 1,
            color: destructive ? colors.danger : colors.text,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
      {iconFilled && (
        <Feather name="check" size={18} color={colors.primary} />
      )}
    </Pressable>
  );
}

// ── Cancel row ──────────────────────────────────────────
function CancelRow({
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
        styles.cancel,
        { borderTopColor: colors.border },
        hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Text
        style={[
          design.type.body,
          { color: colors.textSecondary, fontWeight: '600' },
        ]}
      >
        Cancel
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    overflow: 'hidden',
    paddingBottom: 8,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  songHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
});