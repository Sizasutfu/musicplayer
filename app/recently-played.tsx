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
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLibrary, type Song } from '../hooks/useLibrary';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useHover } from '../hooks/useHover';
import BackButton from '../components/BackButton';
import MiniPlayer from '../components/MiniPlayer';
import SongActionSheet from '../components/SongActionSheet';

// Matches the content cap used by library, favorites,
// recently-added, and the other pushed list screens.
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
    return { hPad: 20, artSize: 52, rowGap: 14, rowVPad: 10, titleSize: 15 };
  }
  if (width < 900) {
    return { hPad: 24, artSize: 60, rowGap: 16, rowVPad: 12, titleSize: 15 };
  }
  return { hPad: 32, artSize: 68, rowGap: 20, rowVPad: 14, titleSize: 16 };
}

export default function RecentlyPlayedScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack, recentIds } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
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
          <View
            style={[
              styles.countRow,
              isWide
                ? {
                    width: '100%',
                    maxWidth: CONTENT_MAX_WIDTH,
                    alignSelf: 'center',
                  }
                : undefined,
              { paddingHorizontal: L.hPad },
            ]}
          >
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {recentSongs.length}{' '}
              {recentSongs.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={recentSongs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 200 }}
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
              <SongRow
                song={item}
                isActive={currentTrack?.id === item.id}
                layout={L}
                onPress={() => playQueue(recentSongs, index)}
                onMenu={() => setActionSong(item)}
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

// ── Song row ────────────────────────────────────────────
// Extracted so it can hold its own hover state. Rendering it
// inline from the parent's renderItem would be a hook-in-a-loop.
function SongRow({
  song,
  isActive,
  layout,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  isActive: boolean;
  layout: Layout;
  onPress: () => void;
  onMenu: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  const subtitle =
    song.album && song.album !== 'Unknown Album'
      ? `${song.artist} · ${song.album}`
      : song.artist;

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
            size={Math.round(layout.artSize * 0.38)}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={[
            styles.rowTitle,
            {
              color: isActive ? colors.primary : colors.text,
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
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '600' },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});