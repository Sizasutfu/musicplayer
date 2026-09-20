// app/_layout.tsx
import TrackPlayer from 'react-native-track-player';
TrackPlayer.registerPlaybackService(() => require('../service'));

import { Stack } from 'expo-router';
import { PlayerProvider } from '../context/PlayerContext';

export default function RootLayout() {
  return (
    <PlayerProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PlayerProvider>
  );
}