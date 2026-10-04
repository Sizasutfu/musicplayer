// app/(drawer)/circle.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCircleTracks } from '../../hooks/useCircleTracks';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderBack } from '../../hooks/useHeaderBack';
import { likeKey } from '../../lib/circle';
import MiniPlayer from '../../components/MiniPlayer';
import LikeButton from '../../components/LikeButton';
import SongActionSheet from '../../components/SongActionSheet';

export default function CircleScreen() {
  const { songs, loading, error, refresh } = useCircleTracks(true);
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();
  const [actionSong, setActionSong] = useState<any>(null);

  useHeaderBack('Circle');

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 8 },
          ]}
        >
          Loading Circle tracks…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={42} color={colors.iconMuted} />
        <Text
          style={[
            design.type.heading,
            { color: colors.text, marginTop: 8, textAlign: 'center' },
          ]}
        >
          Can't reach Circle
        </Text>
        <Text
          style={[
            design.type.caption,
            {
              color: colors.textSecondary,
              marginTop: 4,
              textAlign: 'center',
              paddingHorizontal: 32,
            },
          ]}
        >
          {error}
        </Text>
        <Pressable
          onPress={refresh}
          style={[
            styles.retryBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: design.radius.pill,
              marginTop: 16,
            },
          ]}
        >
          <Text
            style={[
              design.type.caption,
              { color: colors.primaryText, fontWeight: '700' },
            ]}
          >
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (songs.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="music" size={42} color={colors.iconMuted} />
        <Text
          style={[
            design.type.heading,
            { color: colors.text, marginTop: 8 },
          ]}
        >
          No Circle tracks
        </Text>
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          Upload tracks from the Circle web app to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 200 }}
        renderItem={({ item, index }) => {
          const active = currentTrack?.id === item.id;
          return (
            <Pressable
              onPress={() => playQueue(songs, index)}
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
              <View
                style={[
                  styles.art,
                  {
                    backgroundColor: colors.artPlaceholder,
                    borderRadius: design.radius.item,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name="radio"
                  size={18}
                  color={active ? colors.primaryText : colors.iconMuted}
                />
              </View>

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
                  {item.artist || 'Unknown Artist'}
                </Text>
              </View>

              {active && (
                <Feather name="volume-2" size={16} color={colors.primary} />
              )}

              <LikeButton uri={likeKey(item)} size={18} />
            </Pressable>
          );
        }}
      />

      <MiniPlayer />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  art: { width: 44, height: 44 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
});