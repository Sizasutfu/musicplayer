// app/recently-added.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLibrary, type Song } from '../hooks/useLibrary';
import { useRecentlyAdded } from '../hooks/useRecentlyAdded';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import BackButton from '../components/BackButton';
import MiniPlayer from '../components/MiniPlayer';
import SongActionSheet from '../components/SongActionSheet';

// Cap the list so a first-time import of a large library doesn't
// render thousands of rows. 100 covers any realistic "recently
// added" set within the 30-day window.
const MAX_ITEMS = 100;

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Added today';
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days} days ago`;
  if (days < 14) return 'Added last week';
  if (days < 30) return `Added ${Math.floor(days / 7)} weeks ago`;
  return `Added ${Math.floor(days / 30)} months ago`;
}

export default function RecentlyAddedScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();
  const [actionSong, setActionSong] = useState<Song | null>(null);

  const recentlyAdded = useRecentlyAdded(songs);
  const items = useMemo(
    () => recentlyAdded.slice(0, MAX_ITEMS),
    [recentlyAdded]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Recently added
          </Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.topBar}>
        <BackButton />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Recently added
        </Text>
        <View style={styles.spacer} />
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Feather name="folder-plus" size={42} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            Nothing new
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
            Tracks added in the last 30 days show up here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.countRow}>
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {items.length} {items.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(entry) => entry.song.id}
            contentContainerStyle={{ paddingBottom: 200 }}
            renderItem={({ item, index }) => (
              <SongRow
                song={item.song}
                subtitle={relativeTime(item.addedAt)}
                isActive={currentTrack?.id === item.song.id}
                onPress={() =>
                  playQueue(
                    items.map((i) => i.song),
                    index
                  )
                }
                onMenu={() => setActionSong(item.song)}
                colors={colors}
                design={design}
              />
            )}
          />
        </>
      )}

      <MiniPlayer bottomOffset={insets.bottom} />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </SafeAreaView>
  );
}

function SongRow({
  song,
  subtitle,
  isActive,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  subtitle: string;
  isActive: boolean;
  onPress: () => void;
  onMenu: () => void;
  colors: any;
  design: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onMenu}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.row,
        isActive && { backgroundColor: colors.rowActive },
        pressed && { opacity: 0.7 },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[
            styles.art,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.art,
            {
              borderRadius: design.radius.item,
              backgroundColor: isActive
                ? colors.primary
                : colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather
            name="music"
            size={20}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={[
            styles.rowTitle,
            { color: isActive ? colors.primary : colors.text },
          ]}
        >
          {song.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 3 },
          ]}
        >
          {song.artist} · {subtitle}
        </Text>
      </View>

      {isActive && (
        <Feather name="volume-2" size={16} color={colors.primary} />
      )}

      <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
        <Feather name="more-vertical" size={18} color={colors.iconMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  spacer: { width: 40, height: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  countRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  art: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});