// app/top-tracks.tsx
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
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import BackButton from '../components/BackButton';
import MiniPlayer from '../components/MiniPlayer';
import SongActionSheet from '../components/SongActionSheet';

const MAX_ITEMS = 100;

type Ranked = { song: Song; count: number; rank: number };

export default function TopTracksScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack, playCounts } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();
  const [actionSong, setActionSong] = useState<Song | null>(null);

  const ranked: Ranked[] = useMemo(() => {
    if (!songs.length) return [];
    const byId = new Map(songs.map((s) => [s.id, s]));

    const list = Object.entries(playCounts)
      .filter(([, n]) => n > 0)
      .map(([id, count]) => {
        const song = byId.get(id);
        return song ? { song, count } : null;
      })
      .filter((x): x is { song: Song; count: number } => x !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_ITEMS)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    return list;
  }, [songs, playCounts]);

  const playFrom = (index: number) => {
    playQueue(
      ranked.map((r) => r.song),
      index
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text
            style={[
              design.type.caption,
              { color: colors.text, fontWeight: '700' },
            ]}
          >
            Your top tracks
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
        <Text
          style={[
            design.type.caption,
            { color: colors.text, fontWeight: '700' },
          ]}
        >
          Your top tracks
        </Text>
        <View style={styles.spacer} />
      </View>

      {ranked.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bar-chart-2" size={42} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            No plays yet
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
            Play some tracks and your most-played will appear here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.countRow}>
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {ranked.length} {ranked.length === 1 ? 'track' : 'tracks'} ·
              ranked by plays
            </Text>
          </View>

          <FlatList
            data={ranked}
            keyExtractor={(entry) => entry.song.id}
            contentContainerStyle={{ paddingBottom: 200 }}
            renderItem={({ item, index }) => (
              <SongRow
                song={item.song}
                rank={item.rank}
                count={item.count}
                isActive={currentTrack?.id === item.song.id}
                onPress={() => playFrom(index)}
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
  rank,
  count,
  isActive,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  rank: number;
  count: number;
  isActive: boolean;
  onPress: () => void;
  onMenu: () => void;
  colors: any;
  design: any;
}) {
  const subtitle =
    song.album && song.album !== 'Unknown Album'
      ? `${song.artist} · ${song.album}`
      : song.artist;

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
      <View style={styles.rankWrap}>
        <Text
          style={[
            styles.rankText,
            { color: isActive ? colors.primary : colors.textMuted },
          ]}
        >
          {rank}
        </Text>
      </View>

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
          {subtitle}
        </Text>
      </View>

      {isActive && (
        <Feather name="volume-2" size={16} color={colors.primary} />
      )}

      <View style={styles.countPill}>
        <Text
          style={[
            design.type.caption,
            {
              color: colors.textMuted,
              fontVariant: ['tabular-nums'],
              fontWeight: '700',
            },
          ]}
        >
          {count} {count === 1 ? 'play' : 'plays'}
        </Text>
      </View>

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
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rankWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  art: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  countPill: {
    paddingHorizontal: 4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});