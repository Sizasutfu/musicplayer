// app/artist/[name].tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLibrary, type Song } from '../../hooks/useLibrary';
import { groupByArtist, type Album, type Artist } from '../../lib/metadata';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 16;
const GAP = 12;
const NUM_COLS = 2;
const TILE_SIZE =
  (SCREEN_WIDTH - H_PADDING * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS;

type Tab = 'albums' | 'songs';

export default function ArtistDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { songs } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { colors, design } = useTheme();
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
      <View style={styles.topBar}>
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
          key="albums"
          data={artist.albums}
          keyExtractor={(item) => item.key}
          numColumns={NUM_COLS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={{ gap: GAP }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ArtistHeader
              artist={artist}
              tab={tab}
              onTabChange={setTab}
              onPlayAll={handlePlayAll}
              colors={colors}
              design={design}
            />
          }
          renderItem={({ item }) => (
            <AlbumTile album={item} colors={colors} design={design} />
          )}
          ListEmptyComponent={
            <Text
              style={[
                design.type.caption,
                { color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ArtistHeader
              artist={artist}
              tab={tab}
              onTabChange={setTab}
              onPlayAll={handlePlayAll}
              colors={colors}
              design={design}
            />
          }
          renderItem={({ item, index }) => {
            const active = currentTrack?.id === item.id;
            return (
              <Pressable
                onPress={() => playQueue(artist.songs, index)}
                onLongPress={() => setActionSong(item)}
                delayLongPress={400}
                style={({ pressed }) => [
                  styles.songRow,
                  {
                    paddingVertical: design.row.paddingVertical,
                    borderBottomWidth: design.row.borderBottomWidth,
                    borderBottomColor: design.row.borderBottomColor,
                  },
                  active && { backgroundColor: colors.rowActive },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.songNumWrap}>
                  {active && isPlaying ? (
                    <Feather
                      name="volume-2"
                      size={14}
                      color={colors.primary}
                    />
                  ) : (
                    <Text
                      style={[
                        design.type.caption,
                        {
                          color: colors.textMuted,
                          fontVariant: ['tabular-nums'],
                        },
                        active && { color: colors.primary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      design.type.body,
                      { color: colors.text, fontWeight: '600' },
                      active && { color: colors.primary },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      design.type.caption,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {item.album && item.album !== 'Unknown Album'
                      ? item.album
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
                  {formatDuration(item.duration)}
                </Text>
              </Pressable>
            );
          }}
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

function ArtistHeader({
  artist,
  tab,
  onTabChange,
  onPlayAll,
  colors,
  design,
}: {
  artist: Artist;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onPlayAll: () => void;
  colors: any;
  design: any;
}) {
  const AVATAR_SIZE = 140;

  return (
    <View style={styles.headerBlock}>
      {artist.artwork ? (
        <Image
          source={{ uri: artist.artwork }}
          style={[
            styles.avatarBig,
            {
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarBig,
            {
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="user" size={48} color={colors.iconMuted} />
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

      <Pressable
        onPress={onPlayAll}
        style={({ pressed }) => [
          styles.playAllBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: design.radius.pill,
          },
          pressed && { opacity: 0.85 },
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

      <View style={styles.tabRow}>
        {(['albums', 'songs'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => onTabChange(t)}
              style={[
                styles.tab,
                {
                  backgroundColor: colors.chipBg,
                  borderRadius: design.radius.pill,
                },
                active && { backgroundColor: colors.chipBgActive },
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
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AlbumTile({
  album,
  colors,
  design,
}: {
  album: Album;
  colors: any;
  design: any;
}) {
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
    paddingHorizontal: 8,
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
    paddingHorizontal: H_PADDING,
    paddingBottom: 160,
    gap: GAP,
  },
  tile: { width: TILE_SIZE, marginBottom: GAP },
  art: { width: TILE_SIZE, height: TILE_SIZE },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  songNumWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
});