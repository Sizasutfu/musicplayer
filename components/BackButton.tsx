// components/BackButton.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

type Props = {
  /** Custom handler. Defaults to back-with-fallback. */
  onPress?: () => void;
  /** Icon size. */
  size?: number;
};

export default function BackButton({ onPress, size = 22 }: Props) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) return onPress();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={styles.btn}>
      <Feather name="arrow-left" size={size} color={colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});