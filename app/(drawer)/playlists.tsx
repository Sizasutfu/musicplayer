// app/(drawer)/playlists.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useLibrary } from '../../hooks/useLibrary';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';

export default function PlaylistsScreen() {
  const { playlists, loaded, create, remove } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const pl = await create(newName.trim());
    setNewName('');
    setCreateOpen(false);
    router.push({
      pathname: '/playlist/[id]',
      params: { id: pl.id },
    } as any);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete playlist?',
      `"${name}" will be removed. Your music files are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
      ]
    );
  };

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          playlists.length > 0 ? (
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textMuted,
                  marginBottom: design.spacing.item - 4,
                },
              ]}
            >
              {playlists.length}{' '}
              {playlists.length === 1 ? 'playlist' : 'playlists'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const trackCount = item.trackUris.length;
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/playlist/[id]',
                  params: { id: item.id },
                } as any)
              }
              onLongPress={() => confirmDelete(item.id, item.name)}
              delayLongPress={400}
              style={({ pressed }) => [
                styles.row,
                {
                  paddingVertical: design.row.paddingVertical + 2,
                  borderBottomWidth: design.row.borderBottomWidth,
                  borderBottomColor: design.row.borderBottomColor,
                },
                pressed && { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.rowActive,
                    borderRadius: design.radius.item,
                  },
                ]}
              >
                <Feather name="list" size={22} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.body,
                    { color: colors.text, fontWeight: '600' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    design.type.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="list" size={42} color={colors.iconMuted} />
            <Text
              style={[
                design.type.heading,
                { color: colors.text, marginTop: 4 },
              ]}
            >
              No playlists yet
            </Text>
            <Text style={[design.type.caption, { color: colors.textSecondary }]}>
              Create one to group your favourite tracks.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => setCreateOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 100,
            shadowColor: colors.fabShadow,
          },
          pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
        ]}
      >
        <Feather name="plus" size={24} color={colors.primaryText} />
      </Pressable>

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCreateOpen(false)}
          />
          <View
            style={[
              design.card,
              styles.modalCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[design.type.heading, { color: colors.text }]}>
              New Playlist
            </Text>
            <Text
              style={[
                design.type.caption,
                { color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
              ]}
            >
              Give it a name to get started.
            </Text>
            <TextInput
              autoFocus
              value={newName}
              onChangeText={setNewName}
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
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setCreateOpen(false);
                  setNewName('');
                }}
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
                onPress={handleCreate}
                disabled={!newName.trim()}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: design.radius.item,
                  },
                  !newName.trim() && { opacity: 0.5 },
                ]}
              >
                <Text
                  style={[design.type.body, { color: colors.primaryText }]}
                >
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  listContent: { paddingTop: 8, paddingBottom: 160 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
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