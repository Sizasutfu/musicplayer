// app/(drawer)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import {
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from 'expo-router/react-navigation';
import { useNavigation } from 'expo-router';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { useTheme } from '../../context/ThemeContext';

// Drawer becomes a permanent sidebar on web at this width. Below
// it, the drawer opens as an overlay via the hamburger or an edge
// swipe — same as phone.
const PERMANENT_DRAWER_BREAKPOINT = 900;

function MenuButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      hitSlop={10}
      style={styles.menuBtn}
    >
      <Feather name="menu" size={22} color={colors.icon} />
    </Pressable>
  );
}

export default function DrawerLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const permanent = isWeb && width >= PERMANENT_DRAWER_BREAKPOINT;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...(props as any)} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        // When the drawer is permanent the hamburger is redundant —
        // the drawer is already open and visible.
        headerLeft: permanent ? () => null : () => <MenuButton />,
        drawerType: permanent ? 'permanent' : 'front',
        swipeEnabled: !permanent,
        drawerStyle: {
          width: 280,
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
          borderRightWidth: permanent ? StyleSheet.hairlineWidth : 0,
        },
        // Permanent drawers don't dim content — the drawer isn't an
        // overlay, so there's nothing to "focus" the user on.
        overlayColor: permanent ? 'transparent' : 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen name="circle" options={{ title: 'Circle' }} />
      <Drawer.Screen name="albums" options={{ title: 'Albums' }} />
      <Drawer.Screen name="artists" options={{ title: 'Artists' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  menuBtn: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 4 },
});