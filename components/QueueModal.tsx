// components/QueueModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import type { Song } from '../hooks/useLibrary';

const MAX_WIDTH = 520;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function QueueModal({ visible, onClose }: Props) {
  const { queue, queueIndex, playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();

  const handleJump = async (index: number) => {
    await playQueue(queue, index);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.center} pointerEvents="box-none">
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: design.radius.card,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[design.type.heading, { color: colors.text }]}>
              Queue
            </Text>
            <Text
              style={[
                design.type.caption,
                { color: colors.textMuted, marginTop: 2 },
              ]}
            >
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
            >
              <Feather name="x" size={20} color={colors.icon} />
            </Pressable>
          </View>

          <FlatList
            data={queue}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            style={styles.list}
            renderItem={({ item, index }) => {
              const isCurrent = index === queueIndex;
              return (
                <Pressable
                  onPress={() => handleJump(index)}
                  style={({ pressed }) => [
                    styles.row,
                    isCurrent && { backgroundColor: colors.rowActive },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {item.artwork ? (
                    <Image
                      source={{ uri: item.artwork }}
                      style={[
                        styles.art,
                        {
                          borderRadius: design.radius.item - 2,
                          backgroundColor: colors.artPlaceholder,
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.art,
                        {
                          borderRadius: design.radius.item - 2,
                          backgroundColor: colors.artPlaceholder,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Feather
                        name="music"
                        size={16}
                        color={colors.iconMuted}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        design.type.body,
                        {
                          color: isCurrent ? colors.primary : colors.text,
                          fontWeight: isCurrent ? '700' : '600',
                        },
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
                  {isCurrent && (
                    <Feather name="volume-2" size={16} color={colors.primary} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  art: {
    width: 40,
    height: 40,
  },
});