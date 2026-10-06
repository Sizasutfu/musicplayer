// app/(drawer)/(tabs)/_layout.tsx
import { Tabs, useNavigation } from 'expo-router';
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
import { useTheme } from '../../../context/ThemeContext';
import NowPlayingAside from '../../../components/NowPlayingAside';

// Matches the drawer's breakpoint. When the drawer is permanent,
// the tabs' hamburger hides.
const PERMANENT_DRAWER_BREAKPOINT = 900;

// The now-playing aside needs room. With the drawer permanent at
// 280px and the aside at 320px, this breakpoint ensures at least
// ~600px of content between them.
const ASIDE_BREAKPOINT = 1200;

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
            // Redundant when the drawer is already on screen.
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
  // row-reverse puts the second child (the aside) on the right
  // without moving any JSX around.
  root: { flex: 1, flexDirection: 'row-reverse' },
  tabsWrap: { flex: 1 },
  menuBtn: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 4 },
});