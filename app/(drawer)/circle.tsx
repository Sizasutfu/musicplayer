// app/(drawer)/circle.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCircleTracks } from '../../hooks/useCircleTracks';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderBack } from '../../hooks/useHeaderBack';
import { useHover } from '../../hooks/useHover';
import { likeKey } from '../../lib/circle';
import MiniPlayer from '../../components/MiniPlayer';
import LikeButton from '../../components/LikeButton';
import SongActionSheet from '../../components/SongActionSheet';

// Matches the content cap used by every other list screen.
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
    return { hPad: 20, artSize: 44, rowGap: 12, rowVPad: 12, titleSize: 15 };
  }
  if (width < 900) {
    return { hPad: 24, artSize: 52, rowGap: 14, rowVPad: 14, titleSize: 15 };
  }
  return { hPad: 32, artSize: 60, rowGap: 16, rowVPad: 14, titleSize: 16 };
}

export default function CircleScreen() {
  const { songs, loading, error, refresh } = useCircleTracks(true);
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [actionSong, setActionSong] = useState<any>(null);

  useHeaderBack('Circle');

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 8 },
          ]}
        >
          Loading Circle tracks…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={42} color={colors.iconMuted} />
        <Text
          style={[
            design.type.heading,
            { color: colors.text, marginTop: 8, textAlign: 'center' },
          ]}
        >
          Can't reach Circle
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
          {error}
        </Text>
        <RetryButton
          onPress={refresh}
          colors={colors}
          design={design}
        />
      </View>
    );
  }

  if (songs.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="music" size={42} color={colors.iconMuted} />
        <Text
          style={[
            design.type.heading,
            { color: colors.text, marginTop: 8 },
          ]}
        >
          No Circle tracks
        </Text>
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 4 },
          ]}
        >
          Upload tracks from the Circle web app to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={songs}
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
            onPress={() => playQueue(songs, index)}
            onMenu={() => setActionSong(item)}
            colors={colors}
            design={design}
          />
        )}
      />

      <MiniPlayer />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </View>
  );
}

// ── Retry button ────────────────────────────────────────
function RetryButton({
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
        styles.retryBtn,
        {
          backgroundColor: colors.primary,
          borderRadius: design.radius.pill,
          marginTop: 16,
        },
        hovered && { opacity: 0.9 },
      ]}
    >
      <Text
        style={[
          design.type.caption,
          { color: colors.primaryText, fontWeight: '700' },
        ]}
      >
        Retry
      </Text>
    </Pressable>
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
  song: any;
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
      <View
        style={{
          width: layout.artSize,
          height: layout.artSize,
          backgroundColor: isActive
            ? colors.primary
            : colors.artPlaceholder,
          borderRadius: design.radius.item,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name="radio"
          size={Math.round(layout.artSize * 0.4)}
          color={isActive ? colors.primaryText : colors.iconMuted}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            {
              color: isActive ? colors.primary : colors.text,
              fontWeight: '600',
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
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {song.artist || 'Unknown Artist'}
        </Text>
      </View>

      {isActive && (
        <Feather name="volume-2" size={16} color={colors.primary} />
      )}

      <LikeButton uri={likeKey(song)} size={18} />
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
});