// app/album/[key].tsx
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
import { groupByAlbum } from '../../lib/metadata';
import { usePlayer } from '../../context/PlayerContext.stub';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';
import SongActionSheet from '../../components/SongActionSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_SIZE = Math.min(SCREEN_WIDTH - 64, 260);

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
  const { colors } = useTheme();
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
          <Text style={[styles.msgTitle, { color: colors.text }]}>
            Album not found
          </Text>
          <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
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
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.iconBtn}>
          <Feather name="chevron-left" size={26} color={colors.icon} />
        </Pressable>
        <Text
          style={[styles.topBarTitle, { color: colors.text }]}
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
        ListHeaderComponent={
          <View style={styles.headerBlock}>
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
                <Feather name="disc" size={72} color={colors.iconMuted} />
              </View>
            )}

            <Text
              numberOfLines={2}
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
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {album.songs.length}{' '}
              {album.songs.length === 1 ? 'track' : 'tracks'}
            </Text>

            <Pressable
              onPress={handlePlayAll}
              style={({ pressed }) => [
                styles.playAllBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="play" size={18} color={colors.primaryText} />
              <Text
                style={[styles.playAllText, { color: colors.primaryText }]}
              >
                Play all
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const active = currentTrack?.id === item.id;
          return (
            <Pressable
              onPress={() => playQueue(album.songs, index)}
              onLongPress={() => setActionSong(item)}
              delayLongPress={400}
              style={({ pressed }) => [
                styles.row,
                active && { backgroundColor: colors.rowActive },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.numWrap}>
                {active && isPlaying ? (
                  <Feather name="volume-2" size={14} color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.trackNum,
                      { color: colors.textMuted },
                      active && { color: colors.primary },
                    ]}
                  >
                    {item.trackNumber ?? index + 1}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.trackTitle,
                    { color: colors.text },
                    active && { color: colors.primary },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.trackArtist, { color: colors.textSecondary }]}
                >
                  {item.artist}
                </Text>
              </View>

              <Text style={[styles.duration, { color: colors.textMuted }]}>
                {formatDuration(item.duration)}
              </Text>
            </Pressable>
          );
        }}
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
    paddingBottom: 24,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  artPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  artist: { fontSize: 15, marginTop: 4, textAlign: 'center' },
  meta: { fontSize: 12, marginTop: 6 },

  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
  },
  playAllText: { fontWeight: '700', fontSize: 15 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  numWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  trackNum: { fontSize: 13, fontVariant: ['tabular-nums'] },
  trackTitle: { fontSize: 15, fontWeight: '600' },
  trackArtist: { fontSize: 12, marginTop: 2 },
  duration: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
});