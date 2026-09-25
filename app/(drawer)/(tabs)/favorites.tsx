// app/(drawer)/(tabs)/favorites.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLibrary, type Song } from '../../../hooks/useLibrary';
import { usePlayer } from '../../../context/PlayerContext';
import { useFavorites } from '../../../hooks/useFavorites';
import { useTheme } from '../../../context/ThemeContext';
import MiniPlayer from '../../../components/MiniPlayer';
import SongActionSheet from '../../../components/SongActionSheet';
import LikeButton from '../../../components/LikeButton';

export default function FavoritesScreen() {
  const { songs, loading: libraryLoading } = useLibrary();
  const { favorites } = useFavorites();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();

  const [actionSong, setActionSong] = useState<Song | null>(null);

  const favoriteTracks: Song[] = useMemo(() => {
    const byUri = new Map<string, Song>();
    for (const s of songs) byUri.set(s.url, s);
    return favorites
      .map((uri) => byUri.get(uri))
      .filter((s): s is Song => Boolean(s));
  }, [songs, favorites]);

  if (libraryLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 8 },
          ]}
        >
          Loading your library…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {favoriteTracks.length === 0 ? (
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
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[design.type.caption, { color: colors.textMuted }]}>
              {favoriteTracks.length}{' '}
              {favoriteTracks.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>

          <FlatList
            data={favoriteTracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 200 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const active = currentTrack?.id === item.id;
              return (
                <Pressable
                  onPress={() => playQueue(favoriteTracks, index)}
                  onLongPress={() => setActionSong(item)}
                  delayLongPress={400}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      paddingVertical: design.row.paddingVertical,
                      borderBottomWidth: design.row.borderBottomWidth,
                      borderBottomColor: design.row.borderBottomColor,
                    },
                    active && { backgroundColor: colors.rowActive },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {item.artwork ? (
                    <Image
                      source={{ uri: item.artwork }}
                      style={[
                        styles.art,
                        { borderRadius: design.radius.item },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.art,
                        {
                          borderRadius: design.radius.item,
                          backgroundColor: colors.artPlaceholder,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                        active && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Feather
                        name="music"
                        size={18}
                        color={
                          active ? colors.primaryText : colors.iconMuted
                        }
                      />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        design.type.body,
                        { color: colors.text, fontWeight: '600' },
                        active && { color: colors.primary },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        design.type.caption,
                        { color: colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {item.artist}
                    </Text>
                  </View>

                  {active && (
                    <Feather
                      name="volume-2"
                      size={14}
                      color={colors.primary}
                    />
                  )}

                  <LikeButton uri={item.url} size={18} />
                </Pressable>
              );
            }}
          />
        </>
      )}

      <MiniPlayer bottomOffset={0} />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  art: { width: 44, height: 44 },
});