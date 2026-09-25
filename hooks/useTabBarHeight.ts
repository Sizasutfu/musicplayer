// hooks/useTabBarHeight.ts
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/**
 * Returns the actual rendered tab bar height, as measured by React
 * Navigation. Use this as the `bottomOffset` for the MiniPlayer on tab
 * screens — it accounts for safe area insets, padding, and any future
 * tab bar style changes without manual math.
 *
 * Only callable from a screen that is a child of the Tabs navigator.
 */
export function useMiniPlayerOffset() {
  const tabBarHeight = useBottomTabBarHeight();
  return tabBarHeight;
}