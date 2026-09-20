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
import { usePlayer } from '../../context/PlayerContext.stub';
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
  const { colors } = useTheme();
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
          <Text style={[styles.msgTitle, { color: colors.text }]}>
            Artist not found
          </Text>
          <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
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
          style={[styles.topBarTitle, { color: colors.text }]}
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
            />
          }
          renderItem={({ item }) => (
            <AlbumTile album={item} colors={colors} />
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
                        styles.songNum,
                        { color: colors.textMuted },
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
                      styles.songTitle,
                      { color: colors.text },
                      active && { color: colors.primary },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.songSub, { color: colors.textSecondary }]}
                  >
                    {item.album && item.album !== 'Unknown Album'
                      ? item.album
                      : 'Unknown Album'}
                  </Text>
                </View>

                <Text style={[styles.duration, { color: colors.textMuted }]}>
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
}: {
  artist: Artist;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onPlayAll: () => void;
  colors: any;
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
        style={[styles.artistName, { color: colors.text }]}
      >
        {artist.name}
      </Text>
      <Text style={[styles.artistMeta, { color: colors.textMuted }]}>
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
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Feather name="play" size={18} color={colors.primaryText} />
        <Text style={[styles.playAllText, { color: colors.primaryText }]}>
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
                { backgroundColor: colors.chipBg },
                active && { backgroundColor: colors.chipBgActive },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.chipText },
                  active && { color: colors.chipTextActive },
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
        style={[styles.tileTitle, { color: colors.text }]}
      >
        {album.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.tileMeta, { color: colors.textMuted }]}
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
    gap: 8,
  },
  msgTitle: { fontSize: 17, fontWeight: '700' },
  mutedText: { fontSize: 14, textAlign: 'center' },

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
  topBarTitle: { fontSize: 14, fontWeight: '700' },

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
  artistName: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  artistMeta: { fontSize: 13, marginTop: 4 },

  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
  },
  playAllText: { fontWeight: '700', fontSize: 15 },

  tabRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  gridContent: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 160,
    gap: GAP,
  },
  tile: { width: TILE_SIZE, marginBottom: GAP },
  art: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 10 },
  artPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  tileMeta: { fontSize: 11, marginTop: 2 },

  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  songNumWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  songNum: { fontSize: 13, fontVariant: ['tabular-nums'] },
  songTitle: { fontSize: 15, fontWeight: '600' },
  songSub: { fontSize: 12, marginTop: 2 },
  duration: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
});