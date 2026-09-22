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
  const { colors, design } = useTheme();

  const albums = useMemo(() => groupByAlbum(songs), [songs]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
          Loading albums…
        </Text>
      </View>
    );
  }

  if (albums.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="disc" size={42} color={colors.iconMuted} />
        <Text
          style={[design.type.heading, { color: colors.text, marginTop: 4 }]}
        >
          No albums yet
        </Text>
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
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
        contentContainerStyle={[
          styles.listContent,
          { gap: design.spacing.item - 2 },
        ]}
        columnWrapperStyle={{ gap: GAP }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AlbumTile album={item} />}
        ListHeaderComponent={
          <Text
            style={[
              design.type.caption,
              {
                color: colors.textMuted,
                marginBottom: design.spacing.item - 4,
                marginTop: 4,
              },
            ]}
          >
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </Text>
        }
      />
      <MiniPlayer />
    </View>
  );
}

function AlbumTile({ album }: { album: Album }) {
  const { colors, design } = useTheme();

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
        <Image
          source={{ uri: album.artwork }}
          style={[styles.art, { borderRadius: design.radius.item + 2 }]}
        />
      ) : (
        <View
          style={[
            styles.art,
            {
              borderRadius: design.radius.item + 2,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="disc" size={36} color={colors.iconMuted} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          design.type.body,
          {
            color: colors.text,
            fontWeight: '700',
            marginTop: 8,
          },
        ]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[design.type.caption, { color: colors.textSecondary, marginTop: 2 }]}
      >
        {album.artist}
      </Text>
      <Text
        style={[design.type.caption, { color: colors.textMuted, marginTop: 2 }]}
      >
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
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
    paddingBottom: 160,
  },
  tile: { width: TILE_SIZE },
  art: { width: TILE_SIZE, height: TILE_SIZE },
});