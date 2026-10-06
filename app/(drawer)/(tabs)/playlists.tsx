// app/(drawer)/(tabs)/playlists.tsx
import React, { useMemo, useState } from 'react';
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
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlaylists } from '../../../hooks/usePlaylists';
import { useLibrary } from '../../../hooks/useLibrary';
import { useTheme } from '../../../context/ThemeContext';
import { useHeaderBack } from '../../../hooks/useHeaderBack';
import { useHover } from '../../../hooks/useHover';
import MiniPlayer from '../../../components/MiniPlayer';

// Matches the content cap used by the other list screens.
const CONTENT_MAX_WIDTH = 900;

const MINI_PLAYER_HEIGHT = 60;
const FAB_GAP_ABOVE_MINI_PLAYER = 16;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  iconSize: number;
  rowGap: number;
  rowVPad: number;
  titleSize: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 20, iconSize: 48, rowGap: 14, rowVPad: 12, titleSize: 15 };
  }
  if (width < 900) {
    return { hPad: 24, iconSize: 56, rowGap: 16, rowVPad: 14, titleSize: 15 };
  }
  return { hPad: 32, iconSize: 64, rowGap: 18, rowVPad: 14, titleSize: 16 };
}

export default function PlaylistsScreen() {
  const { playlists, loaded, create, remove } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useHeaderBack('Playlists');

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

  const closeCreate = () => {
    setCreateOpen(false);
    setNewName('');
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
        contentContainerStyle={[styles.listContent, { paddingHorizontal: L.hPad }]}
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
        renderItem={({ item }) => (
          <PlaylistRow
            playlist={item}
            layout={L}
            onPress={() =>
              router.push({
                pathname: '/playlist/[id]',
                params: { id: item.id },
              } as any)
            }
            onLongPress={() => confirmDelete(item.id, item.name)}
            colors={colors}
            design={design}
          />
        )}
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
            <Text
              style={[
                design.type.caption,
                { color: colors.textSecondary, marginTop: 4 },
              ]}
            >
              Create one to group your favourite tracks.
            </Text>
          </View>
        }
      />

      <CreateFAB
        onPress={() => setCreateOpen(true)}
        colors={colors}
      />

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCreate}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <Pressable style={styles.modalBackdrop} onPress={closeCreate} />

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
                  {
                    color: colors.textSecondary,
                    marginTop: 4,
                    marginBottom: 16,
                  },
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
                <ModalButton
                  label="Cancel"
                  variant="secondary"
                  onPress={closeCreate}
                  colors={colors}
                  design={design}
                />
                <ModalButton
                  label="Create"
                  variant="primary"
                  onPress={handleCreate}
                  disabled={!newName.trim()}
                  colors={colors}
                  design={design}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <MiniPlayer bottomOffset={0} />
    </View>
  );
}

// ── Playlist row ────────────────────────────────────────
// Extracted so it can hold its own hover state. Rendering it
// inline from the parent's renderItem would be a hook-in-a-loop.
function PlaylistRow({
  playlist,
  layout,
  onPress,
  onLongPress,
  colors,
  design,
}: {
  playlist: any;
  layout: Layout;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  const trackCount = playlist.trackUris.length;

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[
        styles.row,
        {
          paddingVertical: layout.rowVPad,
          gap: layout.rowGap,
        },
        hovered && isWeb && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <View
        style={{
          width: layout.iconSize,
          height: layout.iconSize,
          backgroundColor: colors.rowActive,
          borderRadius: design.radius.item,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name="list"
          size={Math.round(layout.iconSize * 0.46)}
          color={colors.primary}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            {
              color: colors.text,
              fontWeight: '600',
              fontSize: layout.titleSize,
            },
          ]}
        >
          {playlist.name}
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
}

// ── FAB ─────────────────────────────────────────────────
function CreateFAB({
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
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          bottom: MINI_PLAYER_HEIGHT + FAB_GAP_ABOVE_MINI_PLAYER,
          shadowColor: colors.fabShadow,
        },
        hovered && { opacity: 0.9, transform: [{ scale: 1.04 }] },
      ]}
    >
      <Feather name="plus" size={24} color={colors.primaryText} />
    </Pressable>
  );
}

// ── Modal button ────────────────────────────────────────
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
    gap: 8,
  },
  listContent: { paddingTop: 8, paddingBottom: 200 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
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

  // ── Create modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    width: '100%',
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