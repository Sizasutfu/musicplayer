// app/(drawer)/(tabs)/favorites.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export default function FavoritesScreen() {
  const { colors, design } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[design.type.title, { color: colors.text }]}>
          Favorites
        </Text>
      </View>

      <View style={styles.center}>
        <Feather name="heart" size={48} color={colors.iconMuted} />
        <Text
          style={[
            design.type.heading,
            { color: colors.text, marginTop: 12 },
          ]}
        >
          No favorites yet
        </Text>
        <Text
          style={[
            design.type.caption,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 6,
              paddingHorizontal: 32,
            },
          ]}
        >
          Tap the heart on any song to save it here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
});