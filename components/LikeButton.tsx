// components/LikeButton.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';

type Props = {
  uri: string;
  size?: number;
  hitSlop?: number;
  mutedColor?: string; // override for dark backgrounds (e.g. mini player)
  activeColor?: string;
};

export default function LikeButton({
  uri,
  size = 20,
  hitSlop = 8,
  mutedColor,
  activeColor,
}: Props) {
  const { colors } = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(uri);

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        toggle(uri);
      }}
      hitSlop={hitSlop}
      style={styles.wrap}
    >
      <Feather
        name="heart"
        size={size}
        color={
          liked
            ? activeColor || '#f43f5e'
            : mutedColor || colors.iconMuted
        }
        style={liked ? undefined : { opacity: 0.9 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});