// app/(drawer)/(tabs)/library.tsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  Keyboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useLibrary, type Song } from "../../../hooks/useLibrary";
import { useCircleTracks } from "../../../hooks/useCircleTracks";
import { isCircleSong } from "../../../lib/circle";
import { usePlayer } from "../../../context/PlayerContext";
import { useTheme } from "../../../context/ThemeContext";
import BackButton from "../../../components/BackButton";
import MiniPlayer from "../../../components/MiniPlayer";
import SongActionSheet from "../../../components/SongActionSheet";

// Library list caps at this width on desktop. Longer lines are
// harder to scan, and everything else in the app caps or centers.
const CONTENT_MAX_WIDTH = 900;

type SortMode = "title" | "artist" | "album";
type Source = "device" | "circle";

const SORTS: { key: SortMode; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
];

// ── Responsive sizing ──────────────────────────────────
// Values are picked per breakpoint rather than derived from a
// single scale factor so they stay predictable and readable.
type Layout = {
  hPad: number; // horizontal gutter for rows + headers
  artSize: number; // song artwork size
  rowGap: number; // gap between artwork and text
  titleSize: number; // "Library" title font
  iconSize: number; // search / sort icon size
  rowVPad: number; // vertical row padding
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return {
      hPad: 20,
      artSize: 52,
      rowGap: 14,
      titleSize: 22,
      iconSize: 20,
      rowVPad: 10,
    };
  }
  if (width < 900) {
    return {
      hPad: 24,
      artSize: 60,
      rowGap: 16,
      titleSize: 24,
      iconSize: 22,
      rowVPad: 12,
    };
  }
  return {
    hPad: 32,
    artSize: 68,
    rowGap: 20,
    titleSize: 28,
    iconSize: 24,
    rowVPad: 14,
  };
}

export default function LibraryScreen() {
  const { songs, loading, enriching, granted, error, refresh } = useLibrary();
  const { playQueue, currentTrack } = usePlayer();
  const { colors, design } = useTheme();
  const navigation = useNavigation();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [source, setSource] = useState<Source>("device");
  const isCircle = !isWeb && source === "circle";
  const circle = useCircleTracks(isCircle);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortMode>("title");
  const [actionSong, setActionSong] = useState<Song | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Track keyboard height so the song list gets extra bottom
  // padding while the keyboard is up. Without this, on Android
  // edge-to-edge the keyboard overlays the window (it doesn't
  // resize it) and the last rows become unreachable.
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const baseSongs = isWeb ? songs : isCircle ? circle.songs : songs;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = baseSongs;
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "artist") {
        const byArtist = (a.artist || "").localeCompare(b.artist || "");
        if (byArtist !== 0) return byArtist;
        return (a.album || "").localeCompare(b.album || "");
      }
      if (sort === "album") {
        const byAlbum = (a.album || "").localeCompare(b.album || "");
        if (byAlbum !== 0) return byAlbum;
        return (a.trackNumber ?? 0) - (b.trackNumber ?? 0);
      }
      return (a.title || "").localeCompare(b.title || "");
    });
    return sorted;
  }, [baseSongs, query, sort]);

  let stateView: React.ReactNode = null;

  if (isWeb) {
    if (loading) {
      stateView = (
        <CenterState
          busy
          title="Loading your library…"
          colors={colors}
          design={design}
        />
      );
    } else if (error) {
      stateView = (
        <CenterState
          icon="wifi-off"
          title="Couldn't load your library"
          subtitle={error}
          actionLabel="Try again"
          onAction={refresh}
          colors={colors}
          design={design}
        />
      );
    }
  } else if (!isCircle) {
    if (loading) {
      stateView = (
        <CenterState
          busy
          title="Loading your library…"
          colors={colors}
          design={design}
        />
      );
    } else if (!granted) {
      stateView = (
        <CenterState
          icon="music"
          title="No access to your music"
          subtitle="Grant permission to see songs on this device."
          actionLabel="Grant permission"
          onAction={refresh}
          colors={colors}
          design={design}
        />
      );
    } else if (error) {
      stateView = (
        <CenterState
          title="Something went wrong"
          subtitle={error}
          actionLabel="Try again"
          onAction={refresh}
          colors={colors}
          design={design}
        />
      );
    }
  } else {
    if (circle.loading && circle.songs.length === 0) {
      stateView = (
        <CenterState
          busy
          title="Loading from Circle…"
          colors={colors}
          design={design}
        />
      );
    } else if (circle.error && circle.songs.length === 0) {
      stateView = (
        <CenterState
          icon="wifi-off"
          title="Couldn't load Circle tracks"
          subtitle={circle.error}
          actionLabel="Try again"
          onAction={circle.refresh}
          colors={colors}
          design={design}
        />
      );
    }
  }

  const renderChips = () => {
    if (isWeb) return null;
    return (
      <View style={[styles.chipsRow, { paddingHorizontal: L.hPad }]}>
        {(["device", "circle"] as Source[]).map((s) => {
          const active = source === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSource(s)}
              style={[
                styles.chip,
                { backgroundColor: colors.chipBg },
                active && { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name={s === "device" ? "smartphone" : "cloud"}
                size={14}
                color={active ? colors.primaryText : colors.chipText}
              />
              <Text
                style={[
                  design.type.caption,
                  {
                    color: colors.chipText,
                    fontWeight: "700",
                    fontSize: 14,
                    marginLeft: 6,
                  },
                  active && { color: colors.primaryText },
                ]}
              >
                {s === "device" ? "Device" : "Circle"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderSortHeader = () => (
    <View
      style={[
        styles.sortRowSticky,
        {
          backgroundColor: colors.background,
          paddingHorizontal: L.hPad,
        },
      ]}
    >
      <Text
        style={[
          design.type.caption,
          {
            color: colors.textMuted,
            fontWeight: "700",
            fontSize: 12,
            letterSpacing: 0.8,
            marginRight: 4,
          },
        ]}
      >
        SORT
      </Text>
      {SORTS.map(({ key, label }) => {
        const active = sort === key;
        return (
          <Pressable
            key={key}
            onPress={() => setSort(key)}
            style={[
              styles.sortChip,
              active && { backgroundColor: colors.rowActive },
            ]}
          >
            <Text
              style={[
                design.type.caption,
                {
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: "700",
                  fontSize: 13,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const showEnriching = !isWeb && !isCircle && enriching;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Content wrapper caps width and centers on wide viewports.
          The search bar and title row align to the same gutter as
          the list, so everything shares a visual left edge. */}
      <View
        style={{
          width: "100%",
          maxWidth: isWide ? CONTENT_MAX_WIDTH : width,
          alignSelf: "center",
        }}
      >
        {searchOpen ? (
          <View style={[styles.searchBar, { paddingHorizontal: L.hPad - 8 }]}>
            <Pressable
              onPress={closeSearch}
              hitSlop={10}
              style={styles.iconBtn}
            >
              <Feather
                name="arrow-left"
                size={L.iconSize + 2}
                color={colors.icon}
              />
            </Pressable>
            <View
              style={[
                styles.searchField,
                {
                  backgroundColor: colors.chipBg,
                  borderRadius: design.radius.pill,
                },
              ]}
            >
              <Feather
                name="search"
                size={16}
                color={colors.iconMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                ref={inputRef}
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Songs, artists, albums"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Feather name="x-circle" size={16} color={colors.iconMuted} />
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.titleRow, { paddingHorizontal: L.hPad - 8 }]}>
            <BackButton />
            <View style={styles.titleBlock}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    fontSize: L.titleSize,
                  },
                ]}
              >
                Library
              </Text>
              <Text
                style={[
                  design.type.caption,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                {baseSongs.length} {baseSongs.length === 1 ? "song" : "songs"}
                {showEnriching ? " · reading tags…" : ""}
              </Text>
            </View>
            <Pressable
              onPress={openSearch}
              hitSlop={10}
              style={[
                styles.searchIconBtn,
                {
                  backgroundColor: colors.chipBg,
                  width: L.iconSize + 24,
                  height: L.iconSize + 24,
                  borderRadius: (L.iconSize + 24) / 2,
                },
              ]}
            >
              <Feather name="search" size={L.iconSize} color={colors.icon} />
            </Pressable>
          </View>
        )}
      </View>

      {stateView ? (
        <>
          {renderChips()}
          {stateView}
        </>
      ) : (
        <SectionList
          sections={[{ data: filtered }]}
          keyExtractor={(item) => item.id}
          style={
            isWide
              ? {
                  width: "100%",
                  maxWidth: CONTENT_MAX_WIDTH,
                  alignSelf: "center",
                }
              : undefined
          }
          contentContainerStyle={{ paddingBottom: 200 + keyboardHeight }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={20}
          windowSize={10}
          removeClippedSubviews
          ListHeaderComponent={renderChips}
          renderSectionHeader={renderSortHeader}
          stickySectionHeadersEnabled
          refreshing={isCircle && circle.loading}
          onRefresh={isCircle ? circle.refresh : undefined}
          renderItem={({ item, index }) => (
            <SongRow
              song={item}
              isActive={currentTrack?.id === item.id}
              onPress={() => playQueue(filtered, index)}
              onLongPress={
                isCircleSong(item) ? undefined : () => setActionSong(item)
              }
              onMenu={
                isCircleSong(item) ? undefined : () => setActionSong(item)
              }
              layout={L}
              colors={colors}
              design={design}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}
              >
                <Feather name="music" size={30} color={colors.iconMuted} />
              </View>
              <Text
                style={[
                  design.type.heading,
                  { color: colors.text, marginTop: 16 },
                ]}
              >
                {query
                  ? "No matches"
                  : isWeb
                    ? "No tracks yet"
                    : isCircle
                      ? "No Circle tracks yet"
                      : "No songs found"}
              </Text>
              <Text
                style={[
                  design.type.caption,
                  {
                    color: colors.textSecondary,
                    marginTop: 6,
                    textAlign: "center",
                    paddingHorizontal: 32,
                    lineHeight: 19,
                  },
                ]}
              >
                {query
                  ? "Try a different search."
                  : isWeb
                    ? "Upload tracks to your Circle server and refresh this page."
                    : isCircle
                      ? "Upload a track to your Circle server, then pull down to refresh."
                      : "Add audio files to this device to see them here."}
              </Text>
            </View>
          }
        />
      )}

      <MiniPlayer bottomOffset={0} />

      <SongActionSheet
        visible={!!actionSong}
        song={actionSong}
        onClose={() => setActionSong(null)}
      />
    </SafeAreaView>
  );
}

function CenterState({
  icon,
  busy,
  title,
  subtitle,
  actionLabel,
  onAction,
  colors,
  design,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  busy?: boolean;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: any;
  design: any;
}) {
  return (
    <View style={styles.center}>
      {busy ? (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text
            style={[
              design.type.caption,
              { color: colors.textSecondary, marginTop: 12 },
            ]}
          >
            {title}
          </Text>
        </>
      ) : (
        <>
          {icon ? (
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.chipBg }]}
            >
              <Feather name={icon} size={30} color={colors.iconMuted} />
            </View>
          ) : null}
          <Text
            style={[
              design.type.heading,
              { color: colors.text, marginTop: icon ? 16 : 0 },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textSecondary,
                  marginTop: 6,
                  textAlign: "center",
                  paddingHorizontal: 32,
                  lineHeight: 19,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
          {actionLabel && onAction ? (
            <Pressable
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: design.radius.pill,
                },
              ]}
              onPress={onAction}
            >
              <Text
                style={[
                  design.type.caption,
                  {
                    color: colors.primaryText,
                    fontWeight: "700",
                    fontSize: 14,
                  },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const SongRow = React.memo(function SongRow({
  song,
  isActive,
  onPress,
  onLongPress,
  onMenu,
  layout,
  colors,
  design,
}: {
  song: Song;
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onMenu?: () => void;
  layout: Layout;
  colors: any;
  design: any;
}) {
  const subtitle =
    song.album && song.album !== "Unknown Album"
      ? `${song.artist} · ${song.album}`
      : song.artist;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: layout.hPad,
          paddingVertical: layout.rowVPad,
          gap: layout.rowGap,
        },
        isActive && { backgroundColor: colors.rowActive },
        pressed && { opacity: 0.7 },
      ]}
    >
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[
            {
              width: layout.artSize,
              height: layout.artSize,
              borderRadius: design.radius.item,
              backgroundColor: colors.artPlaceholder,
            },
          ]}
        />
      ) : (
        <View
          style={[
            {
              width: layout.artSize,
              height: layout.artSize,
              borderRadius: design.radius.item,
              backgroundColor: isActive
                ? colors.primary
                : colors.artPlaceholder,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Feather
            name="music"
            size={Math.round(layout.artSize * 0.38)}
            color={isActive ? colors.primaryText : colors.iconMuted}
          />
        </View>
      )}

      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={[
            styles.rowTitle,
            {
              color: isActive ? colors.primary : colors.text,
              fontSize: layout.artSize >= 68 ? 16 : 15,
            },
          ]}
        >
          {song.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.caption,
            { color: colors.textSecondary, marginTop: 3 },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      {isActive ? (
        <Feather name="volume-2" size={16} color={colors.primary} />
      ) : null}

      {onMenu ? (
        <Pressable onPress={onMenu} hitSlop={10} style={styles.menuBtn}>
          <Feather name="more-vertical" size={18} color={colors.iconMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  title: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  searchIconBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },

  sortRowSticky: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontWeight: "600",
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
});
