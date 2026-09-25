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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useLibrary, type Song } from '../../hooks/useLibrary';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, remove, rename, removeTrack } = usePlaylists();
  const { songs, loading: libraryLoading } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { colors, design } = useTheme();

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
        <View style={styles.topBar}>
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
      <View style={styles.topBar}>
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
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.cover,
                {
                  backgroundColor: colors.artPlaceholder,
                  borderRadius: design.radius.card + 4,
                },
              ]}
            >
              <Feather name="list" size={56} color={colors.iconMuted} />
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
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              {totalMin > 0 ? ` · ${totalMin} min` : ''}
            </Text>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => handlePlay(0)}
                disabled={tracks.length === 0}
                style={({ pressed }) => [
                  styles.playAllBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: design.radius.pill,
                  },
                  tracks.length === 0 && { opacity: 0.4 },
                  pressed && tracks.length > 0 && { opacity: 0.85 },
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

              <Pressable
                onPress={confirmDelete}
                style={[
                  styles.secondaryBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: design.radius.pill,
                  },
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
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const active = currentTrack?.id === item.id;
          return (
            <Pressable
              onPress={() => handlePlay(index)}
              onLongPress={() => setActionSong(item)}
              delayLongPress={400}
              style={({ pressed }) => [
                styles.row,
                {
                  paddingVertical: design.row.paddingVertical,
                  borderBottomWidth: design.row.borderBottomWidth,
                  borderBottomColor: design.row.borderBottomColor,
                },
                active && { backgroundColor: colors.rowActive },
                pressed && { opacity: 0.7 },
              ]}
            >
              {item.artwork ? (
                <Image
                  source={{ uri: item.artwork }}
                  style={[
                    styles.art,
                    { borderRadius: design.radius.item },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.art,
                    {
                      borderRadius: design.radius.item,
                      backgroundColor: colors.artPlaceholder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather
                    name="music"
                    size={16}
                    color={active ? colors.primaryText : colors.iconMuted}
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.body,
                    { color: colors.text, fontWeight: '600' },
                    active && { color: colors.primary },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {item.artist}
                </Text>
              </View>

              {active && isPlaying && (
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
                {formatDuration(item.duration)}
              </Text>
            </Pressable>
          );
        }}
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

      <MiniPlayer />

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

      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setRenameOpen(false)}
          />
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
              value={renameText}
              onChangeText={setRenameText}
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
              onSubmitEditing={submitRename}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setRenameOpen(false)}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.chipBg,
                    borderRadius: design.radius.item,
                  },
                ]}
              >
                <Text style={[design.type.body, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitRename}
                disabled={!renameText.trim()}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: design.radius.item,
                  },
                  !renameText.trim() && { opacity: 0.5 },
                ]}
              >
                <Text
                  style={[design.type.body, { color: colors.primaryText }]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 8,
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  cover: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    gap: 12,
    paddingHorizontal: 20,
  },
  art: { width: 44, height: 44 },

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
    ...StyleSheet.absoluteFillObject,
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