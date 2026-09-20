// app/(tabs)/index.tsx
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLibrary, type Song } from '../../hooks/useLibrary';
import { usePlayer } from '../../context/PlayerContext';

export default function LibraryScreen() {
  const { songs, loading, granted, error } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayer();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>
          We need access to your music library to show your songs.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{error}</Text>
      </View>
    );
  }

  const handlePress = (song: Song, index: number) => {
    playQueue(songs, index);
  };

  return (
    <FlatList
      data={songs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 120 }}
      renderItem={({ item, index }) => {
        const active = currentTrack?.id === item.id;
        return (
          <Pressable
            onPress={() => handlePress(item, index)}
            style={[styles.row, active && styles.rowActive]}
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={[styles.title, active && styles.titleActive]}
              >
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.sub}>
                {item.artist}
              </Text>
            </View>
            {active && isPlaying && <Text style={styles.badge}>▶</Text>}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.msg}>No songs found on this device.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { textAlign: 'center', color: '#666', fontSize: 16 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowActive: { backgroundColor: '#f0f6ff' },
  title: { fontSize: 16, fontWeight: '500' },
  titleActive: { color: '#0a63ff' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: { fontSize: 16, color: '#0a63ff', marginLeft: 12 },
});