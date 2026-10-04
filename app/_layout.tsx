// app/_layout.tsx
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Method getInfoAsync imported from "expo-file-system" is deprecated',
]);

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
  const [bootstrapped, setBootstrapped] = useState(false);
  const router = useRouter();

  // One-time entry check. Runs once per app launch — never again.
  //
  // This is deliberately NOT keyed on segments. When the user
  // finishes onboarding, welcome writes the flag and calls
  // router.replace('/'). If this effect listened to segments, that
  // navigation would re-trigger the check, still see the cached
  // "not seen" state, and bounce straight back to welcome. An
  // empty dep list sidesteps that entirely: entry routing happens
  // once at boot, and welcome owns its own exit.
  useEffect(() => {
    let cancelled = false;

    hasSeenOnboarding()
      .then((seen) => {
        if (cancelled) return;
        if (!seen) router.replace('/welcome');
        setBootstrapped(true);
      })
      .catch(() => {
        if (!cancelled) setBootstrapped(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
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
          name="recently-played"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="recently-added"
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

      {!bootstrapped && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
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

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});