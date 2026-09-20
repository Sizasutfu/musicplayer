// app/index.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { hasSeenOnboarding } from '../lib/onboarding';

export default function Index() {
  const { colors, loaded } = useTheme();

  useEffect(() => {
    if (!loaded) return;
    hasSeenOnboarding().then((seen) => {
      if (seen) router.replace('/(drawer)');
      else router.replace('/welcome');
    });
  }, [loaded]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}