// app/(drawer)/(tabs)/_layout.tsx
import React, { useEffect, useRef } from 'react';
import { Tabs, useNavigation, usePathname, useRouter } from 'expo-router';
import {
  StyleSheet,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { DrawerActions } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import NowPlayingAside from '../../../components/NowPlayingAside';

// Matches the breakpoints used elsewhere in the app.
const PERMANENT_DRAWER_BREAKPOINT = 900;
const ASIDE_BREAKPOINT = 1200;

// ── Last-tab persistence ────────────────────────────────
// Stored as the URL form (`/library`, `/playlists`, etc.) so it
// survives route-tree refactors that change file locations but
// keep the URLs stable.
const LAST_TAB_KEY = 'nav:lastTab:v1';

// Only these paths are persisted. `/favorites` is reachable via
// the home screen heart but isn't a tab, so restoring to it would
// be confusing — the user would land on a screen with no tab
// highlighted.
const PERSISTED_TABS = ['/', '/library', '/playlists', '/settings'];

// Guards against re-restoring after the tabs layout re-mounts
// during the same session — which happens every time the user
// visits a drawer peer (Circle, Albums, Artists, Profile) and
// comes back. Only a full JS reload (cold start) resets it.
let restoredThisSession = false;

/**
 * Restores the last open tab once per app launch, then keeps the
 * saved value up to date as the user navigates between tabs.
 *
 * Skipped on web: the browser URL is the source of truth there,
 * and the bottom tab bar is hidden anyway.
 */
function usePersistLastTab() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useRef(false);

  // Restore once per session.
  useEffect(() => {
    if (Platform.OS === 'web') {
      hydrated.current = true;
      return;
    }

    if (restoredThisSession) {
      // Tabs layout re-mounted mid-session — don't re-restore.
      // Still mark hydrated so the persist effect can run below.
      hydrated.current = true;
      return;
    }
    restoredThisSession = true;

    let cancelled = false;
    (async () => {
      try {
        const last = await AsyncStorage.getItem(LAST_TAB_KEY);
        if (cancelled) return;
        if (last && PERSISTED_TABS.includes(last) && pathname !== last) {
          router.replace(last as any);
        }
      } catch {
        // ignore — fall through to the default tab
      } finally {
        if (!cancelled) hydrated.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever the active tab changes. Gated on `hydrated`
  // so the initial pathname (which is `/` before the restore
  // resolves) doesn't overwrite the saved value.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!hydrated.current) return;
    if (!PERSISTED_TABS.includes(pathname)) return;
    AsyncStorage.setItem(LAST_TAB_KEY, pathname).catch(() => {});
  }, [pathname]);
}

function MenuButton() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const openDrawer = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.dispatch(DrawerActions.toggleDrawer());
    } else {
      navigation.dispatch(DrawerActions.toggleDrawer());
    }
  };

  return (
    <Pressable onPress={openDrawer} hitSlop={10} style={styles.menuBtn}>
      <Feather name="menu" size={22} color={colors.icon} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  usePersistLastTab();

  const isWeb = Platform.OS === 'web';
  const drawerPermanent = isWeb && width >= PERMANENT_DRAWER_BREAKPOINT;
  const showAside = isWeb && width >= ASIDE_BREAKPOINT;

  const BASE_HEIGHT = Platform.OS === 'ios' ? 50 : 56;
  const totalHeight = BASE_HEIGHT + insets.bottom;

  return (
    <View style={styles.root}>
      {showAside && <NowPlayingAside />}

      <View style={styles.tabsWrap}>
        <Tabs
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.headerBg },
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerLeft: drawerPermanent
              ? () => null
              : () => <MenuButton />,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.iconMuted,
            tabBarStyle: isWeb
              ? { display: 'none' }
              : {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  height: totalHeight,
                  paddingTop: 6,
                  paddingBottom: insets.bottom,
                },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginBottom: Platform.OS === 'ios' ? 0 : 4,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              title: 'Library',
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'musical-notes' : 'musical-notes-outline'}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="playlists"
            options={{
              title: 'Playlists',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'list' : 'list-outline'}
                  size={26}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'settings' : 'settings-outline'}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          {/* Route exists but is hidden from the tab bar. Reachable
              via the home screen heart button. Not persisted — it
              isn't a tab. */}
          <Tabs.Screen
            name="favorites"
            options={{
              href: null,
              headerShown: true,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row-reverse' },
  tabsWrap: { flex: 1 },
  menuBtn: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 4 },
});