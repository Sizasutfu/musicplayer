// app/album/[key].tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLibrary, type Song } from '../../hooks/useLibrary';
import { groupByAlbum } from '../../lib/metadata';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useHover } from '../../hooks/useHover';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

// Matches the cap used by library, artists, and artist detail.
const CONTENT_MAX_WIDTH = 900;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  artSize: number;
  artBottomGap: number;
  headerTopPad: number;
  headerBottomPad: number;
  rowVPad: number;
};

function layoutFor(width: number, height: number): Layout {
  if (width < 500) {
    return {
      hPad: 20,
      artSize: Math.min(width - 64, 260),
      artBottomGap: 20,
      headerTopPad: 8,
      headerBottomPad: 24,
      rowVPad: 12,
    };
  }
  if (width < 900) {
    return {
      hPad: 24,
      artSize: Math.min(width - 160, 300, height * 0.4),
      artBottomGap: 24,
      headerTopPad: 12,
      headerBottomPad: 28,
      rowVPad: 14,
    };
  }
  return {
    hPad: 32,
    artSize: Math.min(360, height * 0.42),
    artBottomGap: 28,
    headerTopPad: 16,
    headerBottomPad: 32,
    rowVPad: 14,
  };
}

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { songs } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { colors, design } = useTheme();

  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width, height), [width, height]);

  const [actionSong, setActionSong] = useState<Song | null>(null);

  const albumKey = useMemo(() => {
    try {
      return decodeURIComponent(key ?? '');
    } catch {
      return key ?? '';
    }
  }, [key]);

  const album = useMemo(() => {
    const all = groupByAlbum(songs);
    return all.find((a) => a.key === albumKey);
  }, [songs, albumKey]);

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/albums');
  };

  const handlePlayAll = () => {
    if (album?.songs.length) playQueue(album.songs, 0);
  };

  if (!album) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <Pressable onPress={handleClose} style={styles.backBtn} hitSlop={10}>
          <Feather name="chevron-left" size={26} color={colors.icon} />
        </Pressable>
        <View style={styles.center}>
          <Text style={[design.type.heading, { color: colors.text }]}>
            Album not found
          </Text>
          <Text
            style={[
              design.type.caption,
              { color: colors.textSecondary, marginTop: 4 },
            ]}
          >
            It may have been removed from your library.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.topBar, { paddingHorizontal: isWide ? 16 : 8 }]}>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={26} color={colors.icon} />
        </Pressable>
        <Text
          style={[
            design.type.caption,
            { color: colors.text, fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          Album
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={album.songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
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
          <AlbumHeader
            album={album}
            layout={L}
            onPlayAll={handlePlayAll}
            colors={colors}
            design={design}
          />
        }
        renderItem={({ item, index }) => (
          <SongListRow
            song={item}
            index={index}
            isActive={currentTrack?.id === item.id}
            isPlaying={isPlaying}
            layout={L}
            colors={colors}
            design={design}
            onPress={() => playQueue(album.songs, index)}
            onMenu={() => setActionSong(item)}
          />
        )}
      />

      <MiniPlayer />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </SafeAreaView>
  );
}

// ── Album header ────────────────────────────────────────
function AlbumHeader({
  album,
  layout,
  onPlayAll,
  colors,
  design,
}: {
  album: ReturnType<typeof groupByAlbum>[number];
  layout: Layout;
  onPlayAll: () => void;
  colors: any;
  design: any;
}) {
  const artSize = layout.artSize;

  return (
    <View
      style={[
        styles.headerBlock,
        {
          paddingHorizontal: layout.hPad + 4,
          paddingTop: layout.headerTopPad,
          paddingBottom: layout.headerBottomPad,
        },
      ]}
    >
      {album.artwork ? (
        <Image
          source={{ uri: album.artwork }}
          style={[
            styles.art,
            {
              width: artSize,
              height: artSize,
              marginBottom: layout.artBottomGap,
              borderRadius: design.radius.card + 4,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.art,
            {
              width: artSize,
              height: artSize,
              marginBottom: layout.artBottomGap,
              borderRadius: design.radius.card + 4,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather
            name="disc"
            size={Math.round(artSize * 0.28)}
            color={colors.iconMuted}
          />
        </View>
      )}

      <Text
        numberOfLines={2}
        style={[
          design.type.title,
          { color: colors.text, textAlign: 'center' },
        ]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          design.type.body,
          {
            color: colors.textSecondary,
            marginTop: 4,
            textAlign: 'center',
          },
        ]}
      >
        {album.artist}
      </Text>
      <Text
        style={[
          design.type.caption,
          { color: colors.textMuted, marginTop: 6 },
        ]}
      >
        {album.songs.length}{' '}
        {album.songs.length === 1 ? 'track' : 'tracks'}
      </Text>

      <PlayAllButton onPress={onPlayAll} colors={colors} design={design} />
    </View>
  );
}

function PlayAllButton({
  onPress,
  colors,
  design,
}: {
  onPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.playAllBtn,
        {
          backgroundColor: colors.primary,
          borderRadius: design.radius.pill,
        },
        hovered && { opacity: 0.9 },
      ]}
    >
      <Feather name="play" size={18} color={colors.primaryText} />
      <Text
        style={[
          design.type.body,
          { color: colors.primaryText, fontWeight: '700' },
        ]}
      >
        Play all
      </Text>
    </Pressable>
  );
}

// ── Song list row ───────────────────────────────────────
function SongListRow({
  song,
  index,
  isActive,
  isPlaying,
  layout,
  colors,
  design,
  onPress,
  onMenu,
}: {
  song: Song;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
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
        },
        isActive && { backgroundColor: colors.rowActive },
        !isActive && isWeb && hovered && {
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <View style={styles.numWrap}>
        {isActive && isPlaying ? (
          <Feather name="volume-2" size={14} color={colors.primary} />
        ) : (
          <Text
            style={[
              design.type.caption,
              {
                color: colors.textMuted,
                fontVariant: ['tabular-nums'],
              },
              isActive && { color: colors.primary },
            ]}
          >
            {song.trackNumber ?? index + 1}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            { color: colors.text, fontWeight: '600' },
            isActive && { color: colors.primary },
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

      <Text
        style={[
          design.type.caption,
          {
            color: colors.textMuted,
            fontVariant: ['tabular-nums'],
            marginLeft: 8,
          },
        ]}
      >
        {formatDuration(song.duration)}
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
    gap: 4,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  headerBlock: {
    alignItems: 'center',
  },
  art: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});