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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLibrary } from '../../hooks/useLibrary';
import { groupByAlbum, type Album } from '../../lib/metadata';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderBack } from '../../hooks/useHeaderBack';
import { useHover } from '../../hooks/useHover';
import MiniPlayer from '../../components/MiniPlayer';

// Matches the content cap used by library, artists, and the artist
// detail screen so lists feel consistent when navigating between
// them.
const CONTENT_MAX_WIDTH = 900;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  gap: number;
  cols: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 16, gap: 12, cols: 2 };
  }
  if (width < 900) {
    return { hPad: 24, gap: 16, cols: 3 };
  }
  return { hPad: 32, gap: 20, cols: 4 };
}

// Tile size derived from min(viewport, cap) so the last column
// doesn't overflow past the capped container on very wide screens.
function computeTileSize(viewportWidth: number, layout: Layout): number {
  const effective = Math.min(viewportWidth, CONTENT_MAX_WIDTH);
  const inner =
    effective - layout.hPad * 2 - layout.gap * (layout.cols - 1);
  return Math.floor(inner / layout.cols);
}

export default function AlbumsScreen() {
  const { songs, loading } = useLibrary();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);
  const tileSize = useMemo(
    () => computeTileSize(width, L),
    [width, L]
  );

  useHeaderBack('Albums');

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
        // numColumns can't change on a mounted FlatList — React
        // Native throws. The key forces a remount when the column
        // count flips, which is what makes the reflow work on
        // browser resize.
        key={`albums-${L.cols}`}
        data={albums}
        keyExtractor={(item) => item.key}
        numColumns={L.cols}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: L.hPad,
            gap: L.gap,
          },
        ]}
        columnWrapperStyle={L.cols > 1 ? { gap: L.gap } : undefined}
        style={
          isWide
            ? {
                width: '100%',
                maxWidth: CONTENT_MAX_WIDTH,
                alignSelf: 'center',
              }
            : undefined
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AlbumTile album={item} size={tileSize} />
        )}
        ListHeaderComponent={
          <Text
            style={[
              design.type.caption,
              {
                color: colors.textMuted,
                marginBottom: design.spacing.item - 4,
                marginTop: 4,
                paddingHorizontal: L.hPad,
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

// ── Album tile ──────────────────────────────────────────
function AlbumTile({ album, size }: { album: Album; size: number }) {
  const { colors, design } = useTheme();
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={() =>
        router.push({
          pathname: '/album/[key]',
          params: { key: encodeURIComponent(album.key) },
        } as any)
      }
      style={[
        { width: size },
        hovered && Platform.OS === 'web' && { opacity: 0.85 },
      ]}
    >
      {album.artwork ? (
        <Image
          source={{ uri: album.artwork }}
          style={{
            width: size,
            height: size,
            borderRadius: design.radius.item + 2,
            backgroundColor: colors.artPlaceholder,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: design.radius.item + 2,
            backgroundColor: colors.artPlaceholder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            name="disc"
            size={Math.round(size * 0.24)}
            color={colors.iconMuted}
          />
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
            fontSize: size >= 200 ? 16 : 15,
          },
        ]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          design.type.caption,
          { color: colors.textSecondary, marginTop: 2 },
        ]}
      >
        {album.artist}
      </Text>
      <Text
        style={[
          design.type.caption,
          { color: colors.textMuted, marginTop: 2 },
        ]}
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
    paddingTop: 8,
    paddingBottom: 160,
  },
});