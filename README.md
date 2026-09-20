# MusicPlayer

A local-first music player for Android and iOS, built with React Native + Expo.

## Features

- Library of all audio files on device, sorted by title / artist / album
- ID3 metadata extraction with on-disk caching
- Albums, artists, and playlists with detail views
- Add to playlist via long-press, with inline playlist creation
- Dark mode (system / light / dark)
- Full-screen player with gesture-driven seek bar

## Stack

- Expo SDK 54
- Expo Router (drawer + modal navigation)
- react-native-track-player (background playback + lock screen controls)
- expo-media-library, expo-audio, expo-file-system
- react-native-reanimated, react-native-gesture-handler
- @missingcore/audio-metadata (ID3 tags)

## Setup

```bash
npm install
npx expo prebuild --clean
npx expo run:android   # or: npx expo run:ios