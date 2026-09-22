// hooks/useTabBarHeight.ts
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_HEIGHT = Platform.OS === 'ios' ? 50 : 56;
const GAP = 4; // space between the tab bar and the mini player

/**
 * Returns the correct `bottomOffset` value for the MiniPlayer on tab screens.
 * Value = tab bar height + OS gesture inset + small gap.
 */
export function useMiniPlayerOffset() {
  const insets = useSafeAreaInsets();
  return BASE_HEIGHT + insets.bottom + GAP;
}

/**
 * Raw tab bar height (without the mini player gap). Use if you need to
 * position something else above the tab bar.
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return BASE_HEIGHT + insets.bottom;
}