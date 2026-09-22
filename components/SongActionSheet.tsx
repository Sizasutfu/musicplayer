// components/SongActionSheet.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { Song } from '../hooks/useLibrary';
import AddToPlaylistSheet from './AddToPlaylistSheet';

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
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const close = () => {
    setPlaylistOpen(false);
    onClose();
  };

  const handlePlayNext = () => {
    Alert.alert(
      'Coming soon',
      'Play next will work once the real player is wired up.'
    );
    close();
  };

  const handleAddToQueue = () => {
    Alert.alert(
      'Coming soon',
      'Add to queue will work once the real player is wired up.'
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
            style={[styles.sheet, { backgroundColor: colors.surface }]}
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

            <Pressable
              onPress={close}
              style={[styles.cancel, { borderTopColor: colors.border }]}
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

function ActionRow({
  icon,
  label,
  onPress,
  colors,
  design,
  destructive,
  last,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  colors: any;
  design: any;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        pressed && { backgroundColor: colors.surfaceElevated },
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
        <Feather
          name={icon}
          size={18}
          color={destructive ? colors.danger : colors.primary}
        />
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
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
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