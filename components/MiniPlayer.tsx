// components/MiniPlayer.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext.stub';
import { useTheme } from '../context/ThemeContext';

type Props = {
  /**
   * Extra space below the mini player. Inside a tab navigator, pass the
   * tab bar height + 12 so it sits above the tab bar. Outside tabs,
   * leave undefined and the OS gesture bar inset is applied automatically.
   */
  bottomOffset?: number;
};

export default function MiniPlayer({ bottomOffset }: Props) {
  const { currentTrack, isPlaying, togglePlayPause, next } = usePlayer();
  const { colors, design } = useTheme();
  const insets = useSafeAreaInsets();

  if (!currentTrack) return null;

  const bottom =
    bottomOffset !== undefined ? bottomOffset : insets.bottom + 12;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayerBg,
          borderRadius: design.radius.card,
          bottom,
        },
      ]}
      onPress={() => router.push('/player')}
    >
      <View
        style={[
          styles.art,
          {
            backgroundColor: colors.miniPlayerBtnBg,
            borderRadius: design.radius.item - 2,
          },
        ]}
      >
        <Feather name="music" size={18} color={colors.miniPlayerText} />
      </View>

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
    left: 12,
    right: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});