// components/MiniPlayer.tsx
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';

const BAR_MAX_WIDTH = 560;
const COMPACT_MARGIN = 12;
const ASIDE_BREAKPOINT = 900;

type Props = {
  bottomOffset?: number;
};

export default function MiniPlayer({ bottomOffset }: Props) {
  const { currentTrack, isPlaying, togglePlayPause, next } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // On wide web the NowPlayingAside takes over. Rendering both would
  // duplicate the controls on screen.
  const isWeb = Platform.OS === 'web';
  const hideForAside = isWeb && width >= ASIDE_BREAKPOINT;
  if (hideForAside) return null;

  if (!currentTrack) return null;

  const isCompact = width < 500;
  const sideMargin = isCompact ? COMPACT_MARGIN : 0;
  const availableWidth = width - sideMargin * 2;
  const barWidth = Math.min(availableWidth, BAR_MAX_WIDTH);
  const centerLeft = (width - barWidth) / 2;

  const bottom =
    bottomOffset !== undefined
      ? isWeb && bottomOffset === 0
        ? 16
        : bottomOffset
      : insets.bottom + 12;

  const artwork = (currentTrack as any).artwork as string | undefined;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayerBg,
          borderRadius: design.radius.card,
          bottom,
          left: centerLeft,
          width: barWidth,
        },
      ]}
      onPress={() => router.push('/player')}
    >
      {artwork ? (
        <Image
          source={{ uri: artwork }}
          style={[
            styles.art,
            {
              borderRadius: design.radius.item - 2,
              backgroundColor: colors.miniPlayerBtnBg,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.art,
            {
              backgroundColor: colors.miniPlayerBtnBg,
              borderRadius: design.radius.item - 2,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="music" size={18} color={colors.miniPlayerText} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.miniPlayerText, fontWeight: '700', fontSize: 14 },
          ]}
        >
          {currentTrack.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.miniPlayerTextSecondary, marginTop: 1 },
          ]}
        >
          {currentTrack.artist}
        </Text>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        hitSlop={10}
        style={styles.iconBtn}
      >
        <Feather
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={colors.miniPlayerText}
        />
      </Pressable>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          next();
        }}
        hitSlop={10}
        style={styles.iconBtn}
      >
        <Feather name="skip-forward" size={18} color={colors.miniPlayerText} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  art: {
    width: 40,
    height: 40,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});