// components/PhotoPickerModal.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CELL = SCREEN_WIDTH / NUM_COLUMNS;
const PAGE_SIZE = 60;

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (localUri: string) => Promise<void> | void;
};

export default function PhotoPickerModal({ visible, onClose, onPick }: Props) {
  const { colors, design } = useTheme();

  const [permission, requestPermission] = MediaLibrary.usePermissions();

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<MediaLibrary.Asset | null>(null);
  const [confirming, setConfirming] = useState(false);

  // ── Reset state each time the modal opens ──────────────
  useEffect(() => {
    if (!visible) return;
    setAssets([]);
    setCursor(undefined);
    setHasNext(true);
    setSelected(null);
    setConfirming(false);
    setLoadingInitial(true);
  }, [visible]);

  // ── Ask for permission the first time we're shown ──────
  useEffect(() => {
    if (!visible) return;
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  // ── Paginated fetch ────────────────────────────────────
  // NOTE: `first` must always be set. Without it getAssetsAsync
  // returns the entire library in one call and locks the JS thread.
  const loadPage = useCallback(async (after?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: PAGE_SIZE,
        after,
        sortBy: MediaLibrary.SortBy.creationTime, // newest first
      });
      setAssets((prev) =>
        after ? [...prev, ...result.assets] : result.assets
      );
      setCursor(result.endCursor);
      setHasNext(result.hasNextPage);
    } catch (e) {
      console.warn('[PhotoPicker] load failed:', e);
    }
  }, []);

  // Initial load once permission is granted.
  useEffect(() => {
    if (!visible) return;
    if (!permission?.granted) return;
    let cancelled = false;
    (async () => {
      setLoadingInitial(true);
      await loadPage();
      if (!cancelled) setLoadingInitial(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, permission?.granted, loadPage]);

  const handleEndReached = useCallback(async () => {
    if (!hasNext || loadingMore || loadingInitial || !cursor) return;
    setLoadingMore(true);
    await loadPage(cursor);
    setLoadingMore(false);
  }, [hasNext, loadingMore, loadingInitial, cursor, loadPage]);

  // ── Confirm selection ──────────────────────────────────
  // The asset URI from the grid is a ph:// / content:// scheme.
  // getAssetInfoAsync resolves it to a real file:// path we can
  // copy and persist.
  const handleConfirm = useCallback(async () => {
    if (!selected || confirming) return;
    setConfirming(true);
    try {
      const info = await MediaLibrary.getAssetInfoAsync(selected);
      const uri = info.localUri ?? info.uri;
      await onPick(uri);
      onClose();
    } catch (e) {
      console.warn('[PhotoPicker] confirm failed:', e);
      Alert.alert('Could not load photo', 'Please try again.');
    } finally {
      setConfirming(false);
    }
  }, [selected, confirming, onPick, onClose]);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = item.id === selected?.id;
    return (
      <Pressable
        onPress={() => setSelected(item)}
        style={{ width: CELL, height: CELL }}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.cell}
          contentFit="cover"
          recyclingKey={item.id}
          transition={80}
        />
        <View
          style={[
            styles.overlay,
            isSelected && {
              borderColor: colors.primary,
              borderWidth: 3,
            },
          ]}
          pointerEvents="none"
        >
          {isSelected && (
            <View
              style={[
                styles.checkBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="check" size={14} color={colors.primaryText} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderPermission = () => (
    <View style={styles.center}>
      <View
        style={[styles.permIcon, { backgroundColor: colors.rowActive }]}
      >
        <Feather name="image" size={32} color={colors.primary} />
      </View>
      <Text
        style={[design.type.title, { color: colors.text, marginTop: 20 }]}
      >
        Photo access needed
      </Text>
      <Text
        style={[
          design.type.body,
          {
            color: colors.textSecondary,
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 32,
            lineHeight: 21,
          },
        ]}
      >
        Allow access to your photos so you can pick a profile picture.
      </Text>
      <Pressable
        onPress={() =>
          permission?.canAskAgain
            ? requestPermission()
            : Linking.openSettings()
        }
        style={[
          styles.permBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: design.radius.pill,
          },
        ]}
      >
        <Text
          style={[
            design.type.body,
            { color: colors.primaryText, fontWeight: '700' },
          ]}
        >
          {permission?.canAskAgain ? 'Allow access' : 'Open settings'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
            <Feather name="x" size={24} color={colors.icon} />
          </Pressable>

          <Text
            style={[
              design.type.body,
              { color: colors.text, fontWeight: '700' },
            ]}
          >
            Choose photo
          </Text>

          <Pressable
            onPress={handleConfirm}
            disabled={!selected || confirming}
            hitSlop={10}
            style={styles.headerBtn}
          >
            {confirming ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text
                style={[
                  design.type.body,
                  {
                    color: selected ? colors.primary : colors.textMuted,
                    fontWeight: '700',
                  },
                ]}
              >
                Done
              </Text>
            )}
          </Pressable>
        </View>

        {!permission?.granted ? (
          renderPermission()
        ) : loadingInitial ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : assets.length === 0 ? (
          <View style={styles.center}>
            <Feather name="image" size={40} color={colors.iconMuted} />
            <Text
              style={[
                design.type.body,
                { color: colors.textMuted, marginTop: 12 },
              ]}
            >
              No photos found
            </Text>
          </View>
        ) : (
          <FlatList
            data={assets}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.6}
            initialNumToRender={24}
            maxToRenderPerBatch={24}
            windowSize={9}
            removeClippedSubviews
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 24 }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  headerBtn: {
    minWidth: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  cell: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBtn: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
});