// app/artist/[name].tsx
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
import { groupByArtist, type Album, type Artist } from '../../lib/metadata';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useHover } from '../../hooks/useHover';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

// Content cap matches the other list screens.
const CONTENT_MAX_WIDTH = 900;

type Tab = 'albums' | 'songs';

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;           // horizontal gutter
  gap: number;            // gap between grid tiles / rows
  cols: number;           // columns in the album grid
  avatarSize: number;     // header artist avatar
  songRowVPad: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 16, gap: 12, cols: 2, avatarSize: 140, songRowVPad: 12 };
  }
  if (width < 900) {
    return { hPad: 24, gap: 16, cols: 3, avatarSize: 160, songRowVPad: 14 };
  }
  return { hPad: 32, gap: 20, cols: 4, avatarSize: 180, songRowVPad: 14 };
}

// Tile size must account for the max-width cap on wide screens —
// otherwise the last column would overflow past the capped
// container on a very wide viewport.
function computeTileSize(
  viewportWidth: number,
  layout: Layout
): number {
  const effective = Math.min(viewportWidth, CONTENT_MAX_WIDTH);
  const inner =
    effective - layout.hPad * 2 - layout.gap * (layout.cols - 1);
  return Math.floor(inner / layout.cols);
}

export default function ArtistDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { songs } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);
  const tileSize = useMemo(
    () => computeTileSize(width, L),
    [width, L]
  );

  const [tab, setTab] = useState<Tab>('albums');
  const [actionSong, setActionSong] = useState<Song | null>(null);

  const artistName = useMemo(() => {
    try {
      return decodeURIComponent(name ?? '');
    } catch {
      return name ?? '';
    }
  }, [name]);

  const artist: Artist | undefined = useMemo(() => {
    const all = groupByArtist(songs);
    return all.find((a) => a.name === artistName);
  }, [songs, artistName]);

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/artists');
  };

  const handlePlayAll = () => {
    if (artist?.songs.length) playQueue(artist.songs, 0);
  };

  if (!artist) {
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
            Artist not found
          </Text>
          <Text
            style={[
              design.type.caption,
              { color: colors.textSecondary, marginTop: 4 },
            ]}
          >
            They may have been removed from your library.
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
          Artist
        </Text>
        <View style={styles.iconBtn} />
      </View>

      {tab === 'albums' ? (
        <FlatList
          key={`albums-${L.cols}`}
          data={artist.albums}
          keyExtractor={(item) => item.key}
          numColumns={L.cols}
          contentContainerStyle={[
            styles.gridContent,
            { paddingHorizontal: L.hPad, gap: L.gap },
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
          ListHeaderComponent={
            <ArtistHeader
              artist={artist}
              tab={tab}
              onTabChange={setTab}
              onPlayAll={handlePlayAll}
              layout={L}
              colors={colors}
              design={design}
            />
          }
          renderItem={({ item }) => (
            <AlbumTile
              album={item}
              size={tileSize}
              colors={colors}
              design={design}
            />
          )}
          ListEmptyComponent={
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textMuted,
                  textAlign: 'center',
                  paddingVertical: 24,
                },
              ]}
            >
              No albums
            </Text>
          }
        />
      ) : (
        <FlatList
          key="songs"
          data={artist.songs}
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
            <ArtistHeader
              artist={artist}
              tab={tab}
              onTabChange={setTab}
              onPlayAll={handlePlayAll}
              layout={L}
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
              onPress={() => playQueue(artist.songs, index)}
              onMenu={() => setActionSong(item)}
            />
          )}
        />
      )}

      <MiniPlayer />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </SafeAreaView>
  );
}

// ── Header ──────────────────────────────────────────────
function ArtistHeader({
  artist,
  tab,
  onTabChange,
  onPlayAll,
  layout,
  colors,
  design,
}: {
  artist: Artist;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onPlayAll: () => void;
  layout: Layout;
  colors: any;
  design: any;
}) {
  const avatarSize = layout.avatarSize;

  return (
    <View style={styles.headerBlock}>
      {artist.artwork ? (
        <Image
          source={{ uri: artist.artwork }}
          style={[
            styles.avatarBig,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarBig,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather
            name="user"
            size={Math.round(avatarSize * 0.34)}
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
        {artist.name}
      </Text>
      <Text
        style={[
          design.type.caption,
          { color: colors.textMuted, marginTop: 4 },
        ]}
      >
        {artist.albums.length}{' '}
        {artist.albums.length === 1 ? 'album' : 'albums'}
        {' · '}
        {artist.totalTracks}{' '}
        {artist.totalTracks === 1 ? 'track' : 'tracks'}
      </Text>

      <PlayAllButton onPress={onPlayAll} colors={colors} design={design} />

      <View style={styles.tabRow}>
        {(['albums', 'songs'] as Tab[]).map((t) => (
          <HeaderTab
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            active={tab === t}
            onPress={() => onTabChange(t)}
            colors={colors}
            design={design}
          />
        ))}
      </View>
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

function HeaderTab({
  label,
  active,
  onPress,
  colors,
  design,
}: {
  label: string;
  active: boolean;
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
        styles.tab,
        {
          backgroundColor: colors.chipBg,
          borderRadius: design.radius.pill,
        },
        active && { backgroundColor: colors.chipBgActive },
        !active && hovered && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Text
        style={[
          design.type.caption,
          { color: colors.chipText, fontWeight: '600' },
          active && {
            color: colors.chipTextActive,
            fontWeight: '700',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Album tile ──────────────────────────────────────────
function AlbumTile({
  album,
  size,
  colors,
  design,
}: {
  album: Album;
  size: number;
  colors: any;
  design: any;
}) {
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
        { width: size, marginBottom: 12 },
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
          <Feather name="disc" size={36} color={colors.iconMuted} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          design.type.body,
          { color: colors.text, fontWeight: '700', marginTop: 8 },
        ]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
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
        styles.songRow,
        {
          paddingHorizontal: layout.hPad,
          paddingVertical: layout.songRowVPad,
        },
        isActive && { backgroundColor: colors.rowActive },
        !isActive && isWeb && hovered && {
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <View style={styles.songNumWrap}>
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
            {index + 1}
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
          {song.album && song.album !== 'Unknown Album'
            ? song.album
            : 'Unknown Album'}
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

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatarBig: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  tabRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  gridContent: {
    paddingBottom: 160,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  songNumWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});