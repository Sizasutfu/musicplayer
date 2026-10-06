// app/(drawer)/(tabs)/favorites.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLibrary, type Song } from '../../../hooks/useLibrary';
import { usePlayer } from '../../../context/PlayerContext';
import { useFavorites } from '../../../hooks/useFavorites';
import { useTheme } from '../../../context/ThemeContext';
import { useHeaderBack } from '../../../hooks/useHeaderBack';
import { useHover } from '../../../hooks/useHover';
import MiniPlayer from '../../../components/MiniPlayer';
import SongActionSheet from '../../../components/SongActionSheet';
import LikeButton from '../../../components/LikeButton';

// Matches the content cap used by every other list screen so
// navigation between them feels consistent on wide viewports.
const CONTENT_MAX_WIDTH = 900;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  artSize: number;
  rowGap: number;
  rowVPad: number;
  titleSize: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 20, artSize: 44, rowGap: 12, rowVPad: 12, titleSize: 15 };
  }
  if (width < 900) {
    return { hPad: 24, artSize: 52, rowGap: 14, rowVPad: 14, titleSize: 15 };
  }
  return { hPad: 32, artSize: 60, rowGap: 16, rowVPad: 14, titleSize: 16 };
}

export default function FavoritesScreen() {
  const { songs, loading: libraryLoading } = useLibrary();
  const { favorites } = useFavorites();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [actionSong, setActionSong] = useState<Song | null>(null);

  useHeaderBack('Favorites');

  const favoriteTracks: Song[] = useMemo(() => {
    const byUri = new Map<string, Song>();
    for (const s of songs) byUri.set(s.url, s);
    return favorites
      .map((uri) => byUri.get(uri))
      .filter((s): s is Song => Boolean(s));
  }, [songs, favorites]);

  if (libraryLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 8 },
          ]}
        >
          Loading your library…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {favoriteTracks.length === 0 ? (
        <View style={styles.center}>
          <Feather name="heart" size={48} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 12 },
            ]}
          >
            No favorites yet
          </Text>
          <Text
            style={[
              design.type.caption,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 6,
                paddingHorizontal: 32,
              },
            ]}
          >
            Tap the heart on any song to save it here.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.header,
              { paddingHorizontal: L.hPad },
            ]}
          >
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {favoriteTracks.length}{' '}
              {favoriteTracks.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={favoriteTracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 200 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={
              isWide
                ? {
                    width: '100%',
                    maxWidth: CONTENT_MAX_WIDTH,
                    alignSelf: 'center',
                  }
                : undefined
            }
            renderItem={({ item, index }) => (
              <FavoriteRow
                song={item}
                isActive={currentTrack?.id === item.id}
                layout={L}
                colors={colors}
                design={design}
                onPress={() => playQueue(favoriteTracks, index)}
                onMenu={() => setActionSong(item)}
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
    </View>
  );
}

// ── Favorite row ────────────────────────────────────────
// Extracted so it can hold its own hover state. Rendering it
// inline from the parent's renderItem would be a hook-in-a-loop.
function FavoriteRow({
  song,
  isActive,
  layout,
  colors,
  design,
  onPress,
  onMenu,
}: {
  song: Song;
  isActive: boolean;
  layout: Layout;
  colors: any;
  design: any;
  onPress: () => void;
  onMenu: () => void;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      onLongPress={onMenu}
      delayLongPress={400}
      style={[
        styles.row,
        {
          paddingHorizontal: layout.hPad,
          paddingVertical: layout.rowVPad,
          gap: layout.rowGap,
        },
        isActive && { backgroundColor: colors.rowActive },
        !isActive && isWeb && hovered && {
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={{
            width: layout.artSize,
            height: layout.artSize,
            borderRadius: design.radius.item,
            backgroundColor: colors.artPlaceholder,
          }}
        />
      ) : (
        <View
          style={{
            width: layout.artSize,
            height: layout.artSize,
            borderRadius: design.radius.item,
            backgroundColor: isActive
              ? colors.primary
              : colors.artPlaceholder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            name="music"
            size={Math.round(layout.artSize * 0.4)}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            {
              color: isActive ? colors.primary : colors.text,
              fontWeight: '600',
              fontSize: layout.titleSize,
            },
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

      {isActive && (
        <Feather name="volume-2" size={14} color={colors.primary} />
      )}

      {/* The heart stays inline on this screen — unlike the
          library, removing from favorites is the primary action
          here, so it should be one tap, not two. */}
      <LikeButton uri={song.url} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});