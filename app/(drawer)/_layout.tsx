// app/(drawer)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from "expo-router/react-navigation";
import { useNavigation } from 'expo-router';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { useTheme } from '../../context/ThemeContext';

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
  return (
    <Drawer
      // Cast through `any`: expo-router bundles its own copy of
      // @react-navigation/drawer, so its DrawerContentComponentProps
      // differs from the standalone package's copy by class identity
      // (protected PrivateValueStore). Structurally identical, but
      // TS refuses to unify them. Safe to widen at this one boundary.
      drawerContent={(props) => (
        <CustomDrawerContent {...(props as any)} />
      )}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerLeft: () => <MenuButton />,
        drawerStyle: { width: 280, backgroundColor: colors.surface },
        swipeEdgeWidth: 60,
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