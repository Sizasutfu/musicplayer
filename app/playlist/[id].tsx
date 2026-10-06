// app/playlist/[id].tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useLibrary, type Song } from '../../hooks/useLibrary';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useHover } from '../../hooks/useHover';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

// Matches the content cap used by the other list screens.
const CONTENT_MAX_WIDTH = 900;

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  coverSize: number;
  artSize: number;
  rowGap: number;
  rowVPad: number;
  titleSize: number;
};

function layoutFor(width: number, height: number): Layout {
  if (width < 500) {
    return {
      hPad: 20,
      coverSize: 160,
      artSize: 44,
      rowGap: 12,
      rowVPad: 12,
      titleSize: 15,
    };
  }
  if (width < 900) {
    return {
      hPad: 24,
      coverSize: 180,
      artSize: 52,
      rowGap: 14,
      rowVPad: 14,
      titleSize: 15,
    };
  }
  return {
    hPad: 32,
    coverSize: Math.min(220, height * 0.28),
    artSize: 60,
    rowGap: 16,
    rowVPad: 14,
    titleSize: 16,
  };
}

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, remove, rename, removeTrack } = usePlaylists();
  const { songs, loading: libraryLoading } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width, height), [width, height]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [actionSong, setActionSong] = useState<Song | null>(null);

  const playlist = useMemo(
    () => playlists.find((p) => p.id === id),
    [playlists, id]
  );

  const songByUri = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of songs) map.set(s.url, s);
    return map;
  }, [songs]);

  const tracks: Song[] = useMemo(() => {
    if (!playlist) return [];
    return playlist.trackUris
      .map((uri) => songByUri.get(uri))
      .filter((s): s is Song => Boolean(s));
  }, [playlist, songByUri]);

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/playlists');
  };

  const handlePlay = (index: number) => {
    if (tracks.length) playQueue(tracks, index);
  };

  const confirmDelete = () => {
    if (!playlist) return;
    Alert.alert(
      'Delete playlist?',
      `"${playlist.name}" will be removed. Your music files are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove(playlist.id);
            handleClose();
          },
        },
      ]
    );
  };

  const openRename = () => {
    if (!playlist) return;
    setRenameText(playlist.name);
    setRenameOpen(true);
  };

  const submitRename = async () => {
    if (!playlist || !renameText.trim()) return;
    await rename(playlist.id, renameText.trim());
    setRenameOpen(false);
  };

  if (!playlist) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={[styles.topBar, { paddingHorizontal: isWide ? 16 : 8 }]}>
          <Pressable onPress={handleClose} style={styles.iconBtn} hitSlop={10}>
            <Feather name="chevron-left" size={26} color={colors.icon} />
          </Pressable>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.center}>
          <Text style={[design.type.heading, { color: colors.text }]}>
            Playlist not found
          </Text>
          <Text
            style={[
              design.type.caption,
              { color: colors.textSecondary, marginTop: 4 },
            ]}
          >
            It may have been deleted.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalDuration = tracks.reduce(
    (acc, s) => acc + (s.duration ?? 0),
    0
  );
  const totalMin = Math.round(totalDuration / 60);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.topBar, { paddingHorizontal: isWide ? 16 : 8 }]}>
        <Pressable onPress={handleClose} style={styles.iconBtn} hitSlop={10}>
          <Feather name="chevron-left" size={26} color={colors.icon} />
        </Pressable>
        <Text
          style={[
            design.type.caption,
            { color: colors.text, fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          Playlist
        </Text>
        <Pressable onPress={openRename} style={styles.iconBtn} hitSlop={10}>
          <Feather name="more-horizontal" size={22} color={colors.icon} />
        </Pressable>
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        style={
          isWide
            ? {
                width: '100%',
                maxWidth: CONTENT_MAX_WIDTH,
                alignSelf: 'center',
              }
            : undefined
        }
        ListHeaderComponent={
          <PlaylistHeader
            playlist={playlist}
            trackCount={tracks.length}
            totalMin={totalMin}
            layout={L}
            onPlayAll={() => handlePlay(0)}
            onDelete={confirmDelete}
            colors={colors}
            design={design}
          />
        }
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            isActive={currentTrack?.id === item.id}
            isPlaying={isPlaying}
            layout={L}
            onPress={() => handlePlay(index)}
            onMenu={() => setActionSong(item)}
            colors={colors}
            design={design}
          />
        )}
        ListEmptyComponent={
          libraryLoading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Feather name="music" size={36} color={colors.iconMuted} />
              <Text
                style={[
                  design.type.heading,
                  { color: colors.text, marginTop: 4 },
                ]}
              >
                Empty playlist
              </Text>
              <Text
                style={[
                  design.type.caption,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    paddingHorizontal: 24,
                  },
                ]}
              >
                Long-press a song in your library to add it here.
              </Text>
            </View>
          )
        }
      />

      <MiniPlayer bottomOffset={insets.bottom} />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
        extraActions={[
          {
            icon: 'minus-circle',
            label: 'Remove from playlist',
            destructive: true,
            onPress: () => {
              if (actionSong) removeTrack(playlist.id, actionSong.url);
            },
          },
        ]}
      />

      <RenameModal
        visible={renameOpen}
        value={renameText}
        onChange={setRenameText}
        onCancel={() => setRenameOpen(false)}
        onSubmit={submitRename}
        colors={colors}
        design={design}
      />
    </SafeAreaView>
  );
}

// ── Playlist header ─────────────────────────────────────
function PlaylistHeader({
  playlist,
  trackCount,
  totalMin,
  layout,
  onPlayAll,
  onDelete,
  colors,
  design,
}: {
  playlist: { name: string };
  trackCount: number;
  totalMin: number;
  layout: Layout;
  onPlayAll: () => void;
  onDelete: () => void;
  colors: any;
  design: any;
}) {
  return (
    <View
      style={[
        styles.headerBlock,
        {
          paddingHorizontal: layout.hPad + 4,
          paddingTop: 8,
          paddingBottom: 20,
        },
      ]}
    >
      <View
        style={{
          width: layout.coverSize,
          height: layout.coverSize,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          backgroundColor: colors.artPlaceholder,
          borderRadius: design.radius.card + 4,
        }}
      >
        <Feather
          name="list"
          size={Math.round(layout.coverSize * 0.35)}
          color={colors.iconMuted}
        />
      </View>

      <Text
        numberOfLines={2}
        style={[
          design.type.title,
          { color: colors.text, textAlign: 'center' },
        ]}
      >
        {playlist.name}
      </Text>
      <Text
        style={[
          design.type.caption,
          { color: colors.textMuted, marginTop: 4 },
        ]}
      >
        {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        {totalMin > 0 ? ` · ${totalMin} min` : ''}
      </Text>

      <View style={styles.headerActions}>
        <PlayAllButton
          onPress={onPlayAll}
          disabled={trackCount === 0}
          colors={colors}
          design={design}
        />
        <DeleteButton
          onPress={onDelete}
          colors={colors}
          design={design}
        />
      </View>
    </View>
  );
}

function PlayAllButton({
  onPress,
  disabled,
  colors,
  design,
}: {
  onPress: () => void;
  disabled?: boolean;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.playAllBtn,
        {
          backgroundColor: colors.primary,
          borderRadius: design.radius.pill,
        },
        hovered && !disabled && { opacity: 0.9 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Feather name="play" size={18} color={colors.primaryText} />
      <Text
        style={[
          design.type.body,
          { color: colors.primaryText, fontWeight: '700' },
        ]}
      >
        Play
      </Text>
    </Pressable>
  );
}

function DeleteButton({
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
        styles.secondaryBtn,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: design.radius.pill,
        },
        hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Feather name="trash-2" size={16} color={colors.danger} />
      <Text
        style={[
          design.type.body,
          { color: colors.danger, fontWeight: '700' },
        ]}
      >
        Delete
      </Text>
    </Pressable>
  );
}

// ── Song row ────────────────────────────────────────────
function SongRow({
  song,
  isActive,
  isPlaying,
  layout,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  layout: Layout;
  onPress: () => void;
  onMenu: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      onLongPress={onMenu}
      delayLongPress={400}
      style={[
        styles.row,
        {
          paddingHorizontal: layout.hPad,
          paddingVertical: layout.rowVPad,
          gap: layout.rowGap,
        },
        isActive && { backgroundColor: colors.rowActive },
        !isActive && isWeb && hovered && {
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={{
            width: layout.artSize,
            height: layout.artSize,
            borderRadius: design.radius.item,
            backgroundColor: colors.artPlaceholder,
          }}
        />
      ) : (
        <View
          style={{
            width: layout.artSize,
            height: layout.artSize,
            borderRadius: design.radius.item,
            backgroundColor: isActive
              ? colors.primary
              : colors.artPlaceholder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            name="music"
            size={Math.round(layout.artSize * 0.36)}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            {
              color: isActive ? colors.primary : colors.text,
              fontWeight: '600',
              fontSize: layout.titleSize,
            },
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

      {isActive && isPlaying && (
        <Feather name="volume-2" size={16} color={colors.primary} />
      )}

      <Text
        style={[
          design.type.caption,
          {
            color: colors.textMuted,
            fontVariant: ['tabular-nums'],
            marginLeft: 8,
          },
        ]}
      >
        {formatDuration(song.duration)}
      </Text>
    </Pressable>
  );
}

// ── Rename modal ────────────────────────────────────────
function RenameModal({
  visible,
  value,
  onChange,
  onCancel,
  onSubmit,
  colors,
  design,
}: {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  colors: any;
  design: any;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
        <Pressable style={styles.modalBackdrop} onPress={onCancel} />
        <View
          style={[
            design.card,
            styles.modalCard,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginBottom: 12 },
            ]}
          >
            Rename playlist
          </Text>
          <TextInput
            autoFocus
            value={value}
            onChangeText={onChange}
            placeholder="Playlist name"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surfaceElevated,
                color: colors.text,
                borderColor: colors.border,
                borderRadius: design.radius.item,
              },
            ]}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <View style={styles.modalActions}>
            <ModalButton
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              colors={colors}
              design={design}
            />
            <ModalButton
              label="Save"
              variant="primary"
              onPress={onSubmit}
              disabled={!value.trim()}
              colors={colors}
              design={design}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ModalButton({
  label,
  variant,
  onPress,
  disabled,
  colors,
  design,
}: {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.modalBtn,
        {
          backgroundColor: isPrimary ? colors.primary : colors.chipBg,
          borderRadius: design.radius.item,
        },
        hovered && !disabled && { opacity: 0.9 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          design.type.body,
          { color: isPrimary ? colors.primaryText : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 4,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBlock: {
    alignItems: 'center',
  },

  headerActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 8,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '86%',
    maxWidth: 420,
    padding: 22,
  },
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});