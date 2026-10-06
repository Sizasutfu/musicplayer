// app/(drawer)/(tabs)/index.tsx
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from 'expo-router/react-navigation';
import { useProfile } from '../../../hooks/useProfile';
import { usePlaylists } from '../../../hooks/usePlaylists';
import { useLibrary, type Song } from '../../../hooks/useLibrary';
import { useRecentlyAdded } from '../../../hooks/useRecentlyAdded';
import { useTheme } from '../../../context/ThemeContext';
import { usePlayer } from '../../../context/PlayerContext';
import MiniPlayer from '../../../components/MiniPlayer';

// Content is capped at this width and centered on wide viewports,
// so text doesn't stretch edge-to-edge on desktop browsers.
const CONTENT_MAX_WIDTH = 1200;

// Horizontal padding inside the content wrapper. Wider on large
// screens so the content isn't flush against the container edges.
function contentPadding(isWide: boolean) {
  return isWide ? 32 : 20;
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const { playlists } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();
  const { playQueue, recentIds, playCounts } = usePlayer();
  const navigation = useNavigation();

  // ── Responsive ─────────────────────────────────────────
  // Breakpoints:
  //   compact  < 500   phone portrait
  //   medium  500-899  phone landscape / small tablet
  //   wide     >= 900  tablet landscape / desktop browser
  const { width } = useWindowDimensions();
  const isCompact = width < 500;
  const isMedium = width >= 500 && width < 900;
  const isWide = width >= 900;

  const tileSize = isCompact ? 130 : isMedium ? 150 : 180;
  const greetingSize = isCompact ? 34 : isMedium ? 40 : 46;
  const hPad = contentPadding(isWide);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const openDrawer = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) parent.dispatch(DrawerActions.toggleDrawer());
    else navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  // ── Time-based greeting ────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }, []);

  const firstName = useMemo(() => {
    const trimmed = profile.name?.trim();
    if (!trimmed) return 'there';
    return trimmed.split(/\s+/)[0];
  }, [profile.name]);

  // ── Today's pick ───────────────────────────────────────
  const todaysPick = useMemo(() => {
    if (!songs.length) return null;

    const pool = [...songs].sort((a, b) => a.id.localeCompare(b.id));

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / 86400000
    );

    const song = pool[dayOfYear % pool.length];
    return {
      song,
      title: song.title,
      subtitle: `${song.artist}${
        song.album && song.album !== 'Unknown Album'
          ? ` · ${song.album}`
          : ''
      }`,
      artwork: song.artwork,
    };
  }, [songs]);

  const handlePickPlay = () => {
    if (!todaysPick) return;
    const idx = songs.findIndex((s) => s.id === todaysPick.song.id);
    playQueue(songs, idx >= 0 ? idx : 0);
  };

  // ── Recently played ────────────────────────────────────
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

  // ── Top tracks ─────────────────────────────────────────
  const topTracks = useMemo(() => {
    if (!songs.length) return [];
    const byId = new Map(songs.map((s) => [s.id, s]));
    const ranked = Object.entries(playCounts)
      .filter(([, n]) => n > 0)
      .map(([id, count]) => {
        const song = byId.get(id);
        return song ? { song, count } : null;
      })
      .filter((x): x is { song: Song; count: number } => x !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return ranked.length >= 3 ? ranked : [];
  }, [songs, playCounts]);

  // ── Recently added ─────────────────────────────────────
  const recentlyAdded = useRecentlyAdded(songs);
  const recentlyAddedTop = useMemo(
    () => recentlyAdded.slice(0, 10),
    [recentlyAdded]
  );

  // ── Playlist resolution ────────────────────────────────
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
        {/* Content wrapper — caps width and centers on wide
            viewports. All inner sections use the same padding
            value so they align to the same gutter. */}
        <View
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center',
          }}
        >
          {/* ── Header ──────────────────────────────────── */}
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
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

          <Text
            style={[
              styles.greeting,
              {
                color: colors.text,
                fontSize: greetingSize,
                paddingHorizontal: hPad,
              },
            ]}
          >
            {greeting}, <Text style={styles.greetingName}>{firstName}</Text>
          </Text>

          {/* ── Today's pick ────────────────────────────── */}
          {todaysPick && (
            <Section
              title="Today's pick"
              paddingHorizontal={hPad}
            >
              <FeaturedCard
                title={todaysPick.title}
                subtitle={todaysPick.subtitle}
                artwork={todaysPick.artwork}
                colors={colors}
                design={design}
                paddingHorizontal={hPad}
                wide={isWide}
                onPlay={handlePickPlay}
              />
            </Section>
          )}

          {/* ── Recently played ─────────────────────────── */}
          {recentSongs.length > 0 && (
            <Section
              title="Recently played"
              onSeeAll={() => router.push('/recently-played')}
              paddingHorizontal={hPad}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.tileRow,
                  { paddingHorizontal: hPad },
                ]}
              >
                {recentSongs.map((song, index) => (
                  <SongTile
                    key={song.id}
                    song={song}
                    subtitle={song.artist}
                    size={tileSize}
                    colors={colors}
                    design={design}
                    onPress={() => playQueue(recentSongs, index)}
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {/* ── Top tracks ──────────────────────────────── */}
          {topTracks.length > 0 && (
            <Section
              title="Your top tracks"
              onSeeAll={() => router.push('/top-tracks')}
              paddingHorizontal={hPad}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.tileRow,
                  { paddingHorizontal: hPad },
                ]}
              >
                {topTracks.map(({ song }, index) => (
                  <SongTile
                    key={song.id}
                    song={song}
                    subtitle={song.artist}
                    rank={index + 1}
                    size={tileSize}
                    colors={colors}
                    design={design}
                    onPress={() =>
                      playQueue(
                        topTracks.map((t) => t.song),
                        index
                      )
                    }
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {/* ── Recently added ──────────────────────────── */}
          {recentlyAddedTop.length > 0 && (
            <Section
              title="Recently added"
              onSeeAll={() => router.push('/recently-added')}
              paddingHorizontal={hPad}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.tileRow,
                  { paddingHorizontal: hPad },
                ]}
              >
                {recentlyAddedTop.map(({ song, addedAt }, index) => (
                  <SongTile
                    key={song.id}
                    song={song}
                    subtitle={relativeTime(addedAt)}
                    size={tileSize}
                    colors={colors}
                    design={design}
                    onPress={() =>
                      playQueue(
                        recentlyAddedTop.map((r) => r.song),
                        index
                      )
                    }
                  />
                ))}
              </ScrollView>
            </Section>
          )}

          {/* ── Top daily playlists ─────────────────────── */}
          <View
            style={[styles.sectionHeader, { paddingHorizontal: hPad }]}
          >
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
                    marginHorizontal: hPad,
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
                    paddingHorizontal={hPad}
                    onPress={() => router.push(`/playlist/${p.id}`)}
                    onPlay={() => {
                      if (resolved.length) playQueue(resolved, 0);
                    }}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <MiniPlayer bottomOffset={0} />
    </SafeAreaView>
  );
}

// ── Section wrapper ──────────────────────────────────────
function Section({
  title,
  onSeeAll,
  paddingHorizontal,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  paddingHorizontal: number;
  children: React.ReactNode;
}) {
  const { colors, design } = useTheme();
  return (
    <>
      <View
        style={[
          styles.sectionHeader,
          { paddingHorizontal },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text
              style={[
                design.type.caption,
                { color: colors.textSecondary, fontWeight: '600' },
              ]}
            >
              See all
            </Text>
          </Pressable>
        )}
      </View>
      {children}
    </>
  );
}

// ── Song tile ────────────────────────────────────────────
function SongTile({
  song,
  subtitle,
  rank,
  size,
  colors,
  design,
  onPress,
}: {
  song: Song;
  subtitle: string;
  rank?: number;
  size: number;
  colors: any;
  design: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { width: size },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View>
        {song.artwork ? (
          <Image
            source={{ uri: song.artwork }}
            style={[
              styles.tileArt,
              {
                width: size,
                height: size,
                borderRadius: design.radius.item,
                backgroundColor: colors.artPlaceholder,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.tileArt,
              {
                width: size,
                height: size,
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
        {rank !== undefined && (
          <View
            style={[
              styles.rankBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[styles.rankText, { color: colors.primaryText }]}
            >
              {rank}
            </Text>
          </View>
        )}
      </View>
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
        {subtitle}
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
  paddingHorizontal,
  wide,
  onPlay,
}: {
  title: string;
  subtitle: string;
  artwork?: string;
  colors: any;
  design: any;
  paddingHorizontal: number;
  wide: boolean;
  onPlay: () => void;
}) {
  const minHeight = wide ? 220 : 170;
  const artWidth = wide ? 260 : 150;
  const titleSize = wide ? 28 : 22;
  const innerPad = wide ? 28 : 20;

  return (
    <View
      style={[
        styles.featuredCard,
        {
          marginHorizontal: paddingHorizontal,
          minHeight,
          backgroundColor: colors.rowActive,
          borderRadius: design.radius.card + 6,
        },
      ]}
    >
      <View style={[styles.featuredLeft, { padding: innerPad }]}>
        <Text
          style={[
            design.type.title,
            { color: colors.text, fontWeight: '800', fontSize: titleSize },
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
              width: artWidth,
              minHeight,
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
              width: artWidth,
              minHeight,
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
  paddingHorizontal,
  onPress,
  onPlay,
}: {
  name: string;
  songs: Song[];
  colors: any;
  design: any;
  paddingHorizontal: number;
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
        { paddingHorizontal },
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
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 20,
  },
  greetingName: { fontWeight: '400' },

  // ── Section header ───────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Tiles ────────────────────────────────────────────
  tileRow: {
    paddingTop: 14,
    gap: 14,
  },
  tileArt: {},
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Featured card ────────────────────────────────────
  featuredCard: {
    flexDirection: 'row',
    marginTop: 14,
    overflow: 'hidden',
  },
  featuredLeft: {
    flex: 1,
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
  featuredIcon: { padding: 4 },
  featuredArt: {
    height: '100%',
  },

  // ── Playlist rows ────────────────────────────────────
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});