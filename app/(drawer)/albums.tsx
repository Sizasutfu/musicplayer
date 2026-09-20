// app/(drawer)/albums.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLibrary } from '../../hooks/useLibrary';
import { groupByAlbum, type Album } from '../../lib/metadata';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 16;
const GAP = 12;
const NUM_COLS = 2;
const TILE_SIZE =
  (SCREEN_WIDTH - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function AlbumsScreen() {
  const { songs, loading } = useLibrary();
  const { colors } = useTheme();

  const albums = useMemo(() => groupByAlbum(songs), [songs]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Loading albums…
        </Text>
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="disc" size={42} color={colors.iconMuted} />
        <Text style={[styles.msgTitle, { color: colors.text }]}>
          No albums yet
        </Text>
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Albums appear once your tracks have metadata.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={albums}
        keyExtractor={(item) => item.key}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ gap: GAP }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AlbumTile album={item} colors={colors} />
        )}
        ListHeaderComponent={
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </Text>
        }
      />
      <MiniPlayer />
    </View>
  );
}

function AlbumTile({ album, colors }: { album: Album; colors: any }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
      onPress={() =>
        router.push({
          pathname: '/album/[key]',
          params: { key: encodeURIComponent(album.key) },
        } as any)
      }
    >
      {album.artwork ? (
        <Image source={{ uri: album.artwork }} style={styles.art} />
      ) : (
        <View
          style={[
            styles.art,
            styles.artPlaceholder,
            { backgroundColor: colors.artPlaceholder },
          ]}
        >
          <Feather name="disc" size={36} color={colors.iconMuted} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[styles.title, { color: colors.text }]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.artist, { color: colors.textSecondary }]}
      >
        {album.artist}
      </Text>
      <Text style={[styles.count, { color: colors.textMuted }]}>
        {album.songs.length} {album.songs.length === 1 ? 'track' : 'tracks'}
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
  msgTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  mutedText: { fontSize: 14, textAlign: 'center' },

  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
    paddingBottom: 160,
    gap: GAP,
  },
  subheading: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },

  tile: {
    width: TILE_SIZE,
    marginBottom: GAP,
  },
  art: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
  },
  artPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  artist: { fontSize: 12, marginTop: 2 },
  count: { fontSize: 11, marginTop: 2 },
});