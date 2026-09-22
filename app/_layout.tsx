// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PlayerProvider } from '../context/PlayerContext.stub';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PlaylistsProvider } from '../context/PlaylistsContext';
import { LibraryProvider } from '../context/LibraryContext';
import { FavoritesProvider } from '../context/FavoritesContext';

function ThemedStack() {
  const { colors, isDark } = useTheme();
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