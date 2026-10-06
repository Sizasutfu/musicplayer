// app/recently-added.tsx
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
import { useRecentlyAdded } from '../hooks/useRecentlyAdded';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useHover } from '../hooks/useHover';
import BackButton from '../components/BackButton';
import MiniPlayer from '../components/MiniPlayer';
import SongActionSheet from '../components/SongActionSheet';

// Cap the list so a first-time import of a large library doesn't
// render thousands of rows. 100 covers any realistic "recently
// added" set within the 30-day window.
const MAX_ITEMS = 100;

// Matches the content cap used by library and the other pushed
// list screens so navigation between them feels consistent.
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

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Added today';
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days} days ago`;
  if (days < 14) return 'Added last week';
  if (days < 30) return `Added ${Math.floor(days / 7)} weeks ago`;
  return `Added ${Math.floor(days / 30)} months ago`;
}

export default function RecentlyAddedScreen() {
  const { songs, loading } = useLibrary();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [actionSong, setActionSong] = useState<Song | null>(null);

  const recentlyAdded = useRecentlyAdded(songs);
  const items = useMemo(
    () => recentlyAdded.slice(0, MAX_ITEMS),
    [recentlyAdded]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Recently added
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
          Recently added
        </Text>
        <View style={styles.spacer} />
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Feather name="folder-plus" size={42} color={colors.iconMuted} />
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: 8 },
            ]}
          >
            Nothing new
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
            Tracks added in the last 30 days show up here.
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
              {items.length} {items.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={items}
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
                subtitle={relativeTime(item.addedAt)}
                isActive={currentTrack?.id === item.song.id}
                layout={L}
                onPress={() =>
                  playQueue(
                    items.map((i) => i.song),
                    index
                  )
                }
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
  subtitle,
  isActive,
  layout,
  onPress,
  onMenu,
  colors,
  design,
}: {
  song: Song;
  subtitle: string;
  isActive: boolean;
  layout: Layout;
  onPress: () => void;
  onMenu: () => void;
  colors: any;
  design: any;
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
          {song.artist} · {subtitle}
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