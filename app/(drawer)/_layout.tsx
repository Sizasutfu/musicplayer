// app/(drawer)/_layout.tsx
import { Drawer } from "expo-router/drawer";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import CustomDrawerContent from "../../components/CustomDrawerContent";
import { useTheme } from "../../context/ThemeContext";

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
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: "700", color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerLeft: () => <MenuButton />,
        drawerStyle: { width: 280, backgroundColor: colors.surface },
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="index" options={{ title: "Library" }} />
      <Drawer.Screen name="albums" options={{ title: "Albums" }} />
      <Drawer.Screen name="artists" options={{ title: "Artists" }} />
      <Drawer.Screen name="playlists" options={{ title: "Playlists" }} />
      <Drawer.Screen name="profile" options={{ title: "Profile" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  menuBtn: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 4 },
});
