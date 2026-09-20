// app/(drawer)/artists.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLibrary } from '../../hooks/useLibrary';
import { groupByArtist, type Artist } from '../../lib/metadata';
import { useTheme } from '../../context/ThemeContext';
import MiniPlayer from '../../components/MiniPlayer';

export default function ArtistsScreen() {
  const { songs, loading } = useLibrary();
  const { colors } = useTheme();

  const artists = useMemo(() => groupByArtist(songs), [songs]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Loading artists…
        </Text>
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="user" size={42} color={colors.iconMuted} />
        <Text style={[styles.msgTitle, { color: colors.text }]}>
          No artists yet
        </Text>
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Artists appear once your tracks have metadata.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
          </Text>
        }
        renderItem={({ item }) => (
          <ArtistRow artist={item} colors={colors} />
        )}
      />
      <MiniPlayer />
    </View>
  );
}

function ArtistRow({ artist, colors }: { artist: Artist; colors: any }) {
  const albumCount = artist.albums.length;
  const trackCount = artist.totalTracks;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/artist/[name]',
          params: { name: encodeURIComponent(artist.name) },
        } as any)
      }
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      {artist.artwork ? (
        <Image source={{ uri: artist.artwork }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: colors.artPlaceholder },
          ]}
        >
          <Feather name="user" size={22} color={colors.iconMuted} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: colors.text }]}
        >
          {artist.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.meta, { color: colors.textSecondary }]}
        >
          {albumCount} {albumCount === 1 ? 'album' : 'albums'}
          {trackCount > 0 ? ` · ${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}` : ''}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  msgTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  mutedText: { fontSize: 14, textAlign: 'center' },

  listContent: {
    paddingTop: 8,
    paddingBottom: 160,
  },
  subheading: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
});