// app/recently-played.tsx
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLibrary, type Song } from '../hooks/useLibrary';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import BackButton from '../components/BackButton';
import MiniPlayer from '../components/MiniPlayer';
import SongActionSheet from '../components/SongActionSheet';

export default function RecentlyPlayedScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack, recentIds } = usePlayer();
  const { colors, design } = useTheme();
  const [actionSong, setActionSong] = useState<Song | null>(null);

  const recentSongs = useMemo(() => {
    if (!recentIds.length) return [];
    const byId = new Map(songs.map((s) => [s.id, s]));
    const out: Song[] = [];
    for (const id of recentIds) {
      const song = byId.get(id);
      if (song) out.push(song);
    }
    return out;
  }, [recentIds, songs]);

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
            Recently played
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
          Recently played
        </Text>
        <View style={styles.spacer} />
      </View>

      {recentSongs.length === 0 ? (
        <View style={styles.center}>
          <Feather name="clock" size={42} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            Nothing played yet
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
            Play a track and it will show up here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.countRow}>
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {recentSongs.length}{' '}
              {recentSongs.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={recentSongs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 200 }}
            renderItem={({ item, index }) => (
              <SongRow
                song={item}
                isActive={currentTrack?.id === item.id}
                onPress={() => playQueue(recentSongs, index)}
                onMenu={() => setActionSong(item)}
                colors={colors}
                design={design}
              />
            )}
          />
        </>
      )}

      <MiniPlayer bottomOffset={0} />

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
  isActive,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
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