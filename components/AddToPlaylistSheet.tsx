// components/AddToPlaylistSheet.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { usePlaylists } from '../hooks/usePlaylists';
import type { Song } from '../hooks/useLibrary';

type Props = {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
};

export default function AddToPlaylistSheet({ visible, song, onClose }: Props) {
  const { colors } = useTheme();
  const { playlists, create, addTrack } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setCreateOpen(false);
    setNewName('');
    onClose();
  };

  const handlePick = async (playlistId: string, playlistName: string) => {
    if (!song) return;
    setBusy(true);
    try {
      await addTrack(playlistId, song.url);
      Alert.alert('Added', `"${song.title}" added to "${playlistName}".`);
      close();
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !song) return;
    setBusy(true);
    try {
      const created = await create(newName.trim());
      await addTrack(created.id, song.url);
      Alert.alert('Created', `"${created.name}" created with "${song.title}".`);
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />

        <SafeAreaView
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          edges={['bottom']}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {!createOpen ? (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Add to playlist
                </Text>
                {song && (
                  <Text
                    numberOfLines={1}
                    style={[styles.subtitle, { color: colors.textSecondary }]}
                  >
                    {song.title} · {song.artist}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() => setCreateOpen(true)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.rowActive }]}
                >
                  <Feather name="plus" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.primary }]}>
                  New playlist
                </Text>
              </Pressable>

              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 320 }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Text
                      style={[styles.emptyText, { color: colors.textMuted }]}
                    >
                      No playlists yet — create one above.
                    </Text>
                  </View>
                }
                renderItem={({ item, index }) => {
                  const hasTrack = song
                    ? item.trackUris.includes(song.url)
                    : false;
                  const isLast = index === playlists.length - 1;
                  return (
                    <Pressable
                      onPress={() => handlePick(item.id, item.name)}
                      disabled={busy}
                      style={({ pressed }) => [
                        styles.row,
                        !isLast && {
                          borderBottomColor: colors.borderSubtle,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                        },
                        pressed && { backgroundColor: colors.surfaceElevated },
                      ]}
                    >
                      <View
                        style={[
                          styles.rowIcon,
                          { backgroundColor: colors.rowActive },
                        ]}
                      >
                        <Feather name="list" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={[styles.rowLabel, { color: colors.text }]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.rowMeta, { color: colors.textMuted }]}
                        >
                          {item.trackUris.length}{' '}
                          {item.trackUris.length === 1 ? 'track' : 'tracks'}
                        </Text>
                      </View>
                      {hasTrack && (
                        <Feather
                          name="check"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                }}
              />

              <Pressable
                onPress={close}
                style={[styles.cancel, { borderTopColor: colors.border }]}
              >
                <Text
                  style={[styles.cancelText, { color: colors.textSecondary }]}
                >
                  Cancel
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  New playlist
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Name it something memorable.
                </Text>
              </View>

              <TextInput
                autoFocus
                value={newName}
                onChangeText={setNewName}
                placeholder="Playlist name"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceElevated,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />

              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    setCreateOpen(false);
                    setNewName('');
                  }}
                  style={[styles.actionBtn, { backgroundColor: colors.chipBg }]}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  disabled={!newName.trim() || busy}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.primary },
                    (!newName.trim() || busy) && { opacity: 0.5 },
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        { color: colors.primaryText },
                      ]}
                    >
                      Create &amp; add
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },

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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 2 },

  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },

  cancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600' },

  input: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '700' },
});