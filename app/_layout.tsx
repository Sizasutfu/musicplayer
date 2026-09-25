// app/_layout.tsx
import { LogBox } from 'react-native';

// Silence the deprecation warning from a dependency still using the
// old expo-file-system API. Remove once the dependency is updated.
LogBox.ignoreLogs([
  'Method getInfoAsync imported from "expo-file-system" is deprecated',
]);

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PlayerProvider } from '../context/PlayerContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PlaylistsProvider } from '../context/PlaylistsContext';
import { LibraryProvider } from '../context/LibraryContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { hasSeenOnboarding } from '../lib/onboarding';

function ThemedStack() {
  const { colors, isDark } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    hasSeenOnboarding()
      .then((seen) => {
        if (mounted) setOnboarded(seen);
      })
      .catch(() => {
        if (mounted) setOnboarded(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (onboarded === null) {
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

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        initialRouteName={onboarded ? '(drawer)' : 'welcome'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen
          name="album/[key]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="artist/[name]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="playlist/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="player"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LibraryProvider>
            <PlaylistsProvider>
              <FavoritesProvider>
                <PlayerProvider>
                  <ThemedStack />
                </PlayerProvider>
              </FavoritesProvider>
            </PlaylistsProvider>
          </LibraryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}