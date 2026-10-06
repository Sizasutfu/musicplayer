// app/top-tracks.tsx
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

const MAX_ITEMS = 100;

// Matches the content cap used by every other list screen.
const CONTENT_MAX_WIDTH = 900;

type Ranked = { song: Song; count: number; rank: number };

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;
  artSize: number;
  rowGap: number;
  rowVPad: number;
  rankWidth: number;
  rankFontSize: number;
  titleSize: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return {
      hPad: 20,
      artSize: 52,
      rowGap: 12,
      rowVPad: 10,
      rankWidth: 22,
      rankFontSize: 14,
      titleSize: 15,
    };
  }
  if (width < 900) {
    return {
      hPad: 24,
      artSize: 60,
      rowGap: 14,
      rowVPad: 12,
      rankWidth: 26,
      rankFontSize: 15,
      titleSize: 15,
    };
  }
  return {
    hPad: 32,
    artSize: 68,
    rowGap: 18,
    rowVPad: 14,
    rankWidth: 32,
    rankFontSize: 17,
    titleSize: 16,
  };
}

export default function TopTracksScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack, playCounts } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [actionSong, setActionSong] = useState<Song | null>(null);

  const ranked: Ranked[] = useMemo(() => {
    if (!songs.length) return [];
    const byId = new Map(songs.map((s) => [s.id, s]));

    const list = Object.entries(playCounts)
      .filter(([, n]) => n > 0)
      .map(([id, count]) => {
        const song = byId.get(id);
        return song ? { song, count } : null;
      })
      .filter((x): x is { song: Song; count: number } => x !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_ITEMS)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    return list;
  }, [songs, playCounts]);

  const playFrom = (index: number) => {
    playQueue(
      ranked.map((r) => r.song),
      index
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Your top tracks
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
          Your top tracks
        </Text>
        <View style={styles.spacer} />
      </View>

      {ranked.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bar-chart-2" size={42} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            No plays yet
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
            Play some tracks and your most-played will appear here.
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
              {ranked.length} {ranked.length === 1 ? 'track' : 'tracks'} ·
              ranked by plays
            </Text>
          </View>

          <FlatList
            data={ranked}
            keyExtractor={(entry) => entry.song.id}
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
                song={item.song}
                rank={item.rank}
                count={item.count}
                isActive={currentTrack?.id === item.song.id}
                layout={L}
                onPress={() => playFrom(index)}
                onMenu={() => setActionSong(item.song)}
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
  rank,
  count,
  isActive,
  layout,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  rank: number;
  count: number;
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
      <View style={[styles.rankWrap, { width: layout.rankWidth }]}>
        <Text
          style={[
            styles.rankText,
            {
              fontSize: layout.rankFontSize,
              color: isActive ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {rank}
        </Text>
      </View>

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

      <View style={styles.countPill}>
        <Text
          style={[
            design.type.caption,
            {
              color: colors.textMuted,
              fontVariant: ['tabular-nums'],
              fontWeight: '700',
            },
          ]}
        >
          {count} {count === 1 ? 'play' : 'plays'}
        </Text>
      </View>

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
  rankWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '600' },
  countPill: {
    paddingHorizontal: 4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});