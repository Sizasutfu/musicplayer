// app/(drawer)/(tabs)/index.tsx
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useProfile } from '../../../hooks/useProfile';
import { usePlaylists } from '../../../hooks/usePlaylists';
import { useLibrary, type Song } from '../../../hooks/useLibrary';
import { useTheme } from '../../../context/ThemeContext';
import { usePlayer } from '../../../context/PlayerContext';
import MiniPlayer from '../../../components/MiniPlayer';

export default function HomeScreen() {
  const { profile } = useProfile();
  const { playlists } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();
  const { playQueue, recentIds } = usePlayer();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const openDrawer = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) parent.dispatch(DrawerActions.toggleDrawer());
    else navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  const firstName = useMemo(() => {
    const trimmed = profile.name?.trim();
    if (!trimmed) return 'there';
    return trimmed.split(/\s+/)[0];
  }, [profile.name]);

  const featured = useMemo(() => {
    const song = songs[0];
    return {
      title: 'Discover weekly',
      subtitle: 'The original slow instrumental best playlists.',
      artwork: song?.artwork,
    };
  }, [songs]);

  const handleFeaturedPlay = () => {
    if (songs.length) playQueue(songs, 0);
  };

  // Resolve recent IDs against the current library. IDs that no
  // longer exist (file deleted, folder renamed) are silently
  // dropped rather than showing a broken tile.
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

  // Same URI → Song bridge as playlists: playlists store trackUris,
  // the player works with Song objects.
  const songByUri = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of songs) map.set(s.url, s);
    return map;
  }, [songs]);

  const resolvePlaylistSongs = useCallback(
    (trackUris: string[] | undefined): Song[] => {
      if (!trackUris?.length) return [];
      const out: Song[] = [];
      for (const uri of trackUris) {
        const song = songByUri.get(uri);
        if (song) out.push(song);
      }
      return out;
    },
    [songByUri]
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: hamburger + greeting actions ─────── */}
        <View style={styles.header}>
          <Pressable
            onPress={openDrawer}
            hitSlop={10}
            style={[
              styles.headerIconBtn,
              { backgroundColor: colors.chipBg },
            ]}
          >
            <Feather name="menu" size={22} color={colors.icon} />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/library')}
              style={[
                styles.headerIconBtn,
                { backgroundColor: colors.chipBg },
              ]}
              hitSlop={6}
            >
              <Feather name="search" size={20} color={colors.icon} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/favorites')}
              style={[
                styles.headerIconBtn,
                { backgroundColor: colors.chipBg },
              ]}
              hitSlop={6}
            >
              <Feather name="heart" size={20} color={colors.icon} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.greeting, { color: colors.text }]}>
          Hi, <Text style={styles.greetingName}>{firstName}</Text>
        </Text>

        {/* ── Recently played ───────────────────────────── */}
        {recentSongs.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 28 },
              ]}
            >
              Recently played
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRow}
            >
              {recentSongs.map((song, index) => (
                <RecentTile
                  key={song.id}
                  song={song}
                  colors={colors}
                  design={design}
                  onPress={() => playQueue(recentSongs, index)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Curated & trending ────────────────────────── */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, marginTop: 28 },
          ]}
        >
          Curated & trending
        </Text>

        <FeaturedCard
          title={featured.title}
          subtitle={featured.subtitle}
          artwork={featured.artwork}
          colors={colors}
          design={design}
          onPlay={handleFeaturedPlay}
        />

        {/* ── Top daily playlists ───────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top daily playlists
          </Text>
          <Pressable onPress={() => router.push('/playlists')} hitSlop={8}>
            <Text
              style={[
                design.type.caption,
                { color: colors.textSecondary, fontWeight: '600' },
              ]}
            >
              See all
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12 }}>
          {playlists.length === 0 ? (
            <View
              style={[
                styles.emptyPlaylists,
                {
                  backgroundColor: colors.surface,
                  borderRadius: design.radius.card,
                },
              ]}
            >
              <Feather name="list" size={28} color={colors.iconMuted} />
              <Text
                style={[
                  design.type.body,
                  { color: colors.text, marginTop: 10, fontWeight: '600' },
                ]}
              >
                No playlists yet
              </Text>
              <Text
                style={[
                  design.type.caption,
                  {
                    color: colors.textSecondary,
                    marginTop: 4,
                    textAlign: 'center',
                  },
                ]}
              >
                Create one to see it here.
              </Text>
            </View>
          ) : (
            playlists.slice(0, 5).map((p) => {
              const resolved = resolvePlaylistSongs(p.trackUris);
              return (
                <PlaylistRow
                  key={p.id}
                  name={p.name}
                  songs={resolved}
                  colors={colors}
                  design={design}
                  onPress={() => router.push(`/playlist/${p.id}`)}
                  onPlay={() => {
                    if (resolved.length) playQueue(resolved, 0);
                  }}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      <MiniPlayer bottomOffset={0} />
    </SafeAreaView>
  );
}

// ── Recent tile ──────────────────────────────────────────
function RecentTile({
  song,
  colors,
  design,
  onPress,
}: {
  song: Song;
  colors: any;
  design: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentTile,
        pressed && { opacity: 0.7 },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[
            styles.recentArt,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.recentArt,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="music" size={24} color={colors.iconMuted} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          design.type.body,
          { color: colors.text, fontWeight: '600', marginTop: 8 },
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
    </Pressable>
  );
}

// ── Featured card ────────────────────────────────────────
function FeaturedCard({
  title,
  subtitle,
  artwork,
  colors,
  design,
  onPlay,
}: {
  title: string;
  subtitle: string;
  artwork?: string;
  colors: any;
  design: any;
  onPlay: () => void;
}) {
  return (
    <View
      style={[
        styles.featuredCard,
        {
          backgroundColor: colors.rowActive,
          borderRadius: design.radius.card + 6,
        },
      ]}
    >
      <View style={styles.featuredLeft}>
        <Text
          style={[
            design.type.title,
            { color: colors.text, fontWeight: '800', fontSize: 22 },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[
            design.type.caption,
            {
              color: colors.textSecondary,
              marginTop: 8,
              lineHeight: 19,
            },
          ]}
          numberOfLines={3}
        >
          {subtitle}
        </Text>

        <View style={styles.featuredActions}>
          <Pressable
            onPress={onPlay}
            style={[
              styles.featuredPlayBtn,
              { backgroundColor: colors.primary },
            ]}
            hitSlop={6}
          >
            <Feather
              name="play"
              size={20}
              color={colors.primaryText}
              style={{ marginLeft: 2 }}
            />
          </Pressable>
          <Pressable hitSlop={8} style={styles.featuredIcon}>
            <Feather name="heart" size={20} color={colors.text} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.featuredIcon}>
            <Feather name="download" size={20} color={colors.text} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.featuredIcon}>
            <Feather name="more-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {artwork ? (
        <Image
          source={{ uri: artwork }}
          style={[
            styles.featuredArt,
            {
              borderTopRightRadius: design.radius.card + 6,
              borderBottomRightRadius: design.radius.card + 6,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.featuredArt,
            {
              backgroundColor: colors.artPlaceholder,
              borderTopRightRadius: design.radius.card + 6,
              borderBottomRightRadius: design.radius.card + 6,
            },
          ]}
        />
      )}
    </View>
  );
}

// ── Playlist row ─────────────────────────────────────────
function PlaylistRow({
  name,
  songs,
  colors,
  design,
  onPress,
  onPlay,
}: {
  name: string;
  songs: Song[];
  colors: any;
  design: any;
  onPress: () => void;
  onPlay: () => void;
}) {
  const cover = songs[0]?.artwork;
  const artist = songs[0]?.artist;
  const songCount = songs.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.playlistRow,
        pressed && { opacity: 0.7 },
      ]}
    >
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={[
            styles.playlistArt,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.playlistArt,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        >
          <Feather name="music" size={20} color={colors.iconMuted} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            { color: colors.text, fontWeight: '700' },
          ]}
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {artist ? `By ${artist} · ` : ''}
          {songCount} {songCount === 1 ? 'Song' : 'Songs'}
        </Text>
      </View>

      <Pressable
        onPress={onPlay}
        disabled={songCount === 0}
        hitSlop={10}
        style={[
          styles.playlistPlayBtn,
          { backgroundColor: colors.chipBg },
          songCount === 0 && { opacity: 0.4 },
        ]}
      >
        <Feather name="play" size={16} color={colors.icon} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 200 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  greetingName: {
    fontWeight: '400',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },

  // ── Recently played ──────────────────────────────────
  recentRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  recentTile: {
    width: 130,
  },
  recentArt: {
    width: 130,
    height: 130,
  },

  // ── Featured card ────────────────────────────────────
  featuredCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    minHeight: 170,
    overflow: 'hidden',
  },
  featuredLeft: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 16,
  },
  featuredPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIcon: {
    padding: 4,
  },
  featuredArt: {
    width: 150,
    height: '100%',
    minHeight: 170,
  },

  // ── Playlist rows ────────────────────────────────────
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  playlistArt: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyPlaylists: {
    marginHorizontal: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});