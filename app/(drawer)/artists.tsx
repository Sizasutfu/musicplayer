// app/(drawer)/artists.tsx
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
import { groupByArtist, type Artist } from '../../lib/metadata';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderBack } from '../../hooks/useHeaderBack';
import { useHover } from '../../hooks/useHover';
import MiniPlayer from '../../components/MiniPlayer';

// Matches the cap used by library and other list screens so
// artist lists don't stretch edge-to-edge on a wide browser.
const CONTENT_MAX_WIDTH = 900;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  avatarSize: number;
  gap: number;
  rowVPad: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 20, avatarSize: 52, gap: 14, rowVPad: 12 };
  }
  if (width < 900) {
    return { hPad: 24, avatarSize: 60, gap: 16, rowVPad: 14 };
  }
  return { hPad: 32, avatarSize: 68, gap: 20, rowVPad: 16 };
}

export default function ArtistsScreen() {
  const { songs, loading } = useLibrary();
  const { colors, design } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  useHeaderBack('Artists');

  const artists = useMemo(() => groupByArtist(songs), [songs]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
          Loading artists…
        </Text>
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="user" size={42} color={colors.iconMuted} />
        <Text
          style={[design.type.heading, { color: colors.text, marginTop: 4 }]}
        >
          No artists yet
        </Text>
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
          Artists appear once your tracks have metadata.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
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
        ListHeaderComponent={
          <Text
            style={[
              design.type.caption,
              {
                color: colors.textMuted,
                marginBottom: design.spacing.item - 4,
                paddingHorizontal: L.hPad,
              },
            ]}
          >
            {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
          </Text>
        }
        renderItem={({ item }) => (
          <ArtistRow artist={item} layout={L} />
        )}
      />
      <MiniPlayer />
    </View>
  );
}

// ── Artist row ──────────────────────────────────────────
// Extracted so it can hold its own hover state. Rendering it
// inline from the parent's renderItem would be a hook-in-a-loop.
function ArtistRow({
  artist,
  layout,
}: {
  artist: Artist;
  layout: Layout;
}) {
  const { colors, design } = useTheme();
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  const albumCount = artist.albums.length;
  const trackCount = artist.totalTracks;
  const avatarRadius = layout.avatarSize / 2;

  return (
    <Pressable
      {...hoverProps}
      onPress={() =>
        router.push({
          pathname: '/artist/[name]',
          params: { name: encodeURIComponent(artist.name) },
        } as any)
      }
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: layout.hPad,
          paddingVertical: layout.rowVPad,
          gap: layout.gap,
        },
        isWeb && hovered && { backgroundColor: colors.surfaceElevated },
        pressed && { opacity: 0.7 },
      ]}
    >
      {artist.artwork ? (
        <Image
          source={{ uri: artist.artwork }}
          style={{
            width: layout.avatarSize,
            height: layout.avatarSize,
            borderRadius: avatarRadius,
            backgroundColor: colors.artPlaceholder,
          }}
        />
      ) : (
        <View
          style={{
            width: layout.avatarSize,
            height: layout.avatarSize,
            borderRadius: avatarRadius,
            backgroundColor: colors.artPlaceholder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            name="user"
            size={Math.round(layout.avatarSize * 0.42)}
            color={colors.iconMuted}
          />
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            {
              color: colors.text,
              fontWeight: '600',
              fontSize: layout.avatarSize >= 68 ? 16 : 15,
            },
          ]}
        >
          {artist.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {albumCount} {albumCount === 1 ? 'album' : 'albums'}
          {trackCount > 0
            ? ` · ${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`
            : ''}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={colors.textMuted} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});