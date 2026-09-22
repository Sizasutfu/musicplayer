
// components/MiniPlayer.tsx

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { usePlayer } from '../context/PlayerContext.stub';
import { useTheme } from '../context/ThemeContext';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, next } = usePlayer();
  const { colors } = useTheme();

  if (!currentTrack) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.miniPlayerBg },
      ]}
    >
      {/* Track info / open player */}
      <Pressable
        style={styles.trackInfo}
        onPress={() => router.push('/player')}
      >
        <View
          style={[
            styles.art,
            { backgroundColor: colors.miniPlayerBtnBg },
          ]}
        >
          {currentTrack.artwork ? (
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.artImage}
            />
          ) : (
            <Feather
              name="music"
              size={18}
              color={colors.miniPlayerText}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: colors.miniPlayerText },
            ]}
          >
            {currentTrack.title}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.sub,
              { color: colors.miniPlayerTextSecondary },
            ]}
          >
            {currentTrack.artist}
          </Text>
        </View>
      </Pressable>

      {/* Play / pause */}
      <Pressable
        onPress={togglePlayPause}
        hitSlop={10}
        style={styles.iconBtn}
      >
        <Feather
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={colors.miniPlayerText}
        />
      </Pressable>

      {/* Next */}
      <Pressable
        onPress={next}
        hitSlop={10}
        style={styles.iconBtn}
      >
        <Feather
          name="skip-forward"
          size={18}
          color={colors.miniPlayerText}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
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

  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  art: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  artImage: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
  },

  sub: {
    fontSize: 12,
    marginTop: 1,
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});



