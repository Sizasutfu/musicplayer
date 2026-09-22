// app/(drawer)/index.tsx
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useLibrary, type Song } from '../../../hooks/useLibrary';
import { usePlayer } from '../../../context/PlayerContext.stub';
import { useTheme } from '../../../context/ThemeContext';
import MiniPlayer from '../../../components/MiniPlayer';
import SongActionSheet from '../../../components/SongActionSheet';

type SortMode = 'title' | 'artist' | 'album';

function MenuButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      hitSlop={10}
      style={styles.headerBtn}
    >
      <Feather name="menu" size={22} color={colors.icon} />
    </Pressable>
  );
}

export default function LibraryScreen() {
  const { songs, loading, enriching, granted, error, refresh } = useLibrary();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortMode>('title');
  const [actionSong, setActionSong] = useState<Song | null>(null);
  const inputRef = useRef<TextInput>(null);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  useLayoutEffect(() => {
    if (searchOpen) {
      navigation.setOptions({
        headerTitle: () => (
          <TextInput
            ref={inputRef}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs, artists, albums"
            placeholderTextColor={colors.textMuted}
            style={[styles.headerSearchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        ),
        headerLeft: () => (
          <Pressable
            onPress={closeSearch}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.icon} />
          </Pressable>
        ),
        headerRight: () =>
          query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              style={styles.headerBtn}
            >
              <Feather name="x-circle" size={20} color={colors.iconMuted} />
            </Pressable>
          ) : null,
      });
    } else {
      navigation.setOptions({
        headerTitle: 'Library',
        headerLeft: () => <MenuButton />,
        headerRight: () => (
          <Pressable
            onPress={openSearch}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Feather name="search" size={20} color={colors.icon} />
          </Pressable>
        ),
      });
    }
  }, [navigation, searchOpen, query, openSearch, closeSearch, colors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = songs;
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'artist') {
        const byArtist = (a.artist || '').localeCompare(b.artist || '');
        if (byArtist !== 0) return byArtist;
        return (a.album || '').localeCompare(b.album || '');
      }
      if (sort === 'album') {
        const byAlbum = (a.album || '').localeCompare(b.album || '');
        if (byAlbum !== 0) return byAlbum;
        return (a.trackNumber ?? 0) - (b.trackNumber ?? 0);
      }
      return (a.title || '').localeCompare(b.title || '');
    });
    return sorted;
  }, [songs, query, sort]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={['left', 'right']}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Loading your library…
        </Text>
      </SafeAreaView>
    );
  }

  if (!granted) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={['left', 'right']}
      >
        <Feather name="music" size={42} color={colors.iconMuted} />
        <Text
          style={[design.type.heading, { color: colors.text, marginTop: 4 }]}
        >
          No access to your music
        </Text>
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          Grant permission to see songs on this device.
        </Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={refresh}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
            Grant permission
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
        edges={['left', 'right']}
      >
        <Text style={[design.type.heading, { color: colors.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
          {error}
        </Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={refresh}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
            Try again
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <View
        style={[
          styles.sortRow,
          {
            paddingTop: design.spacing.section - 8,
            paddingBottom: design.spacing.item,
            gap: design.spacing.item - 4,
          },
        ]}
      >
        {(['title', 'artist', 'album'] as SortMode[]).map((mode) => {
          const active = sort === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSort(mode)}
              style={[
                styles.sortBtn,
                { backgroundColor: colors.chipBg, borderRadius: design.radius.pill },
                active && { backgroundColor: colors.chipBgActive },
              ]}
            >
              <Text
                style={[
                  design.type.caption,
                  { color: colors.chipText },
                  active && { color: colors.chipTextActive, fontWeight: '700' },
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </Pressable>
          );
        })}
        {enriching && (
          <View
            style={[
              styles.enrichingChip,
              {
                backgroundColor: colors.rowActive,
                borderRadius: design.radius.pill,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[
                design.type.caption,
                { color: colors.primary, fontWeight: '700' },
              ]}
            >
              Reading tags
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={20}
        windowSize={10}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            isActive={currentTrack?.id === item.id}
            onPress={() => playQueue(filtered, index)}
            onLongPress={() => setActionSong(item)}
            colors={colors}
            design={design}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Feather name="music" size={42} color={colors.iconMuted} />
            <Text style={[design.type.heading, { color: colors.text }]}>
              {query ? 'No matches' : 'No songs found'}
            </Text>
            <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
              {query
                ? 'Try a different search.'
                : 'Add audio files to this device to see them here.'}
            </Text>
          </View>
        }
      />

      <MiniPlayer />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </SafeAreaView>
  );
}

const SongRow = React.memo(function SongRow({
  song,
  isActive,
  onPress,
  onLongPress,
  colors,
  design,
}: {
  song: Song;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
  design: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: design.row.paddingVertical,
          borderBottomWidth: design.row.borderBottomWidth,
          borderBottomColor: design.row.borderBottomColor,
        },
        isActive && { backgroundColor: colors.rowActive },
        pressed && { opacity: 0.7 },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[
            styles.artImage,
            { borderRadius: design.radius.item, backgroundColor: colors.artPlaceholder },
          ]}
        />
      ) : (
        <View
          style={[
            styles.artPlaceholder,
            {
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
            isActive && { backgroundColor: colors.primary },
          ]}
        >
          <Feather
            name="music"
            size={18}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            { color: colors.text, fontWeight: '600' },
            isActive && { color: colors.primary },
          ]}
        >
          {song.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {song.artist}
          {song.album && song.album !== 'Unknown Album'
            ? ` · ${song.album}`
            : ''}
        </Text>
      </View>

      {isActive && <Feather name="volume-2" size={16} color={colors.primary} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  mutedText: { fontSize: 14, textAlign: 'center' },
  primaryBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
  },
  primaryBtnText: { fontWeight: '700', fontSize: 14 },

  headerBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  headerSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minWidth: 200,
  },

  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  enrichingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  artPlaceholder: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artImage: {
    width: 44,
    height: 44,
  },
});