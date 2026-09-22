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
  const { colors, design } = useTheme();

  const artists = useMemo(() => groupByArtist(songs), [songs]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
          Loading artists…
        </Text>
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="user" size={42} color={colors.iconMuted} />
        <Text
          style={[design.type.heading, { color: colors.text, marginTop: 4 }]}
        >
          No artists yet
        </Text>
        <Text style={[design.type.caption, { color: colors.textSecondary }]}>
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
          <Text
            style={[
              design.type.caption,
              { color: colors.textMuted, marginBottom: design.spacing.item - 4 },
            ]}
          >
            {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
          </Text>
        }
        renderItem={({ item }) => <ArtistRow artist={item} />}
      />
      <MiniPlayer />
    </View>
  );
}

function ArtistRow({ artist }: { artist: Artist }) {
  const { colors, design } = useTheme();
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
        {
          paddingVertical: design.row.paddingVertical + 2,
          borderBottomWidth: design.row.borderBottomWidth,
          borderBottomColor: design.row.borderBottomColor,
        },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      {artist.artwork ? (
        <Image
          source={{ uri: artist.artwork }}
          style={[styles.avatar, { borderRadius: 26 }]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            {
              borderRadius: 26,
              backgroundColor: colors.artPlaceholder,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="user" size={22} color={colors.iconMuted} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[design.type.body, { color: colors.text, fontWeight: '600' }]}
        >
          {artist.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {albumCount} {albumCount === 1 ? 'album' : 'albums'}
          {trackCount > 0
            ? ` · ${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`
            : ''}
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
  listContent: {
    paddingTop: 8,
    paddingBottom: 160,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  avatar: { width: 52, height: 52 },
});