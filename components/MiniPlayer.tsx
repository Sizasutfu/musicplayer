// components/MiniPlayer.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext.stub';
import { useTheme } from '../context/ThemeContext';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, next } = usePlayer();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!currentTrack) return null;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayerBg,
          bottom: insets.bottom + 12,
        },
      ]}
      onPress={() => router.push('/player')}
    >
      <View style={[styles.art, { backgroundColor: colors.miniPlayerBtnBg }]}>
        <Feather name="music" size={18} color={colors.miniPlayerText} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.miniPlayerText }]}
        >
          {currentTrack.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.sub, { color: colors.miniPlayerTextSecondary }]}
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
    // bottom set dynamically in component via insets
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 1 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});