// components/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import Constants from 'expo-constants';
import { router, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { useHover } from '../hooks/useHover';
import ProfileAvatar from './ProfileAvatar';

type Item = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  /** File-system route. Matches what router.push expects. */
  route: string;
};

const PRIMARY: Item[] = [
  { label: 'Home', icon: 'home', route: '/(drawer)/(tabs)' },
  { label: 'Library', icon: 'music', route: '/(drawer)/(tabs)/library' },
  {
    label: 'Playlists',
    icon: 'list',
    route: '/(drawer)/(tabs)/playlists',
  },
  {
    label: 'Favorites',
    icon: 'heart',
    route: '/(drawer)/(tabs)/favorites',
  },
  {
    label: 'Settings',
    icon: 'settings',
    route: '/(drawer)/(tabs)/settings',
  },
];

const BROWSE: Item[] = [
  { label: 'Circle', icon: 'radio', route: '/(drawer)/circle' },
  { label: 'Albums', icon: 'disc', route: '/(drawer)/albums' },
  { label: 'Artists', icon: 'user', route: '/(drawer)/artists' },
  { label: 'Profile', icon: 'user-check', route: '/(drawer)/profile' },
];

/**
 * Convert an expo-router file-system path to the URL form that
 * usePathname() returns.
 *   /(drawer)/(tabs)/library  →  /library
 *   /(drawer)/(tabs)          →  /
 *   /(drawer)/circle          →  /circle
 *
 * Group segments in parentheses are URL-transparent — they don't
 * appear in the browser URL and usePathname() strips them.
 */
function toUrlPath(route: string): string {
  const stripped = route.replace(/\/\([^)]+\)/g, '');
  return stripped === '' ? '/' : stripped;
}

function isRouteActive(pathname: string, route: string): boolean {
  const urlPath = toUrlPath(route);
  // Home matches only the exact root — otherwise every route
  // "starts with /" and Home would always be highlighted.
  if (urlPath === '/') return pathname === '/' || pathname === '';
  return pathname === urlPath || pathname.startsWith(urlPath + '/');
}

// ── Nav item ────────────────────────────────────────────
// Extracted so each row can hold its own hover state. Rendered
// from the parent's map() would be a hook-in-a-loop violation.
function NavItem({
  item,
  active,
  onPress,
}: {
  item: Item;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, design } = useTheme();
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderRadius: design.radius.item,
          marginBottom: design.spacing.item - 10,
        },
        active && { backgroundColor: colors.rowActive },
        !active && hovered && { backgroundColor: colors.surfaceElevated },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Feather
        name={item.icon}
        size={20}
        color={active ? colors.primary : colors.iconMuted}
      />
      <Text
        style={[
          design.type.body,
          { color: active ? colors.primary : colors.textSecondary },
          active && { fontWeight: '700' },
        ]}
      >
        {item.label}
      </Text>
      {active && (
        <View
          style={[styles.activeDot, { backgroundColor: colors.primary }]}
        />
      )}
    </Pressable>
  );
}

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { colors, design } = useTheme();
  const { profile } = useProfile();
  const pathname = usePathname();
  const profileHover = useHover();

  const goToProfile = () => {
    router.push('/(drawer)/profile');
    props.navigation.closeDrawer();
  };

  const go = (route: string) => {
    router.push(route as any);
    props.navigation.closeDrawer();
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surface }]}
      edges={['top', 'bottom']}
    >
      <Pressable
        {...profileHover.hoverProps}
        onPress={goToProfile}
        style={[
          styles.profileHeader,
          profileHover.hovered && {
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <ProfileAvatar
          name={profile.name}
          color={profile.avatarColor}
          uri={profile.avatarUri}
          size={52}
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[
              design.type.body,
              { color: colors.text, fontWeight: '700' },
            ]}
          >
            {profile.name}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              design.type.caption,
              { color: colors.textMuted, marginTop: 2 },
            ]}
          >
            @{profile.username}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            design.type.sectionLabel,
            {
              color: colors.textMuted,
              paddingHorizontal: 12,
              marginBottom: 8,
            },
          ]}
        >
          YOUR MUSIC
        </Text>
        {PRIMARY.map((item) => (
          <NavItem
            key={item.route}
            item={item}
            active={isRouteActive(pathname, item.route)}
            onPress={() => go(item.route)}
          />
        ))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text
          style={[
            design.type.sectionLabel,
            {
              color: colors.textMuted,
              paddingHorizontal: 12,
              marginBottom: 8,
            },
          ]}
        >
          BROWSE
        </Text>
        {BROWSE.map((item) => (
          <NavItem
            key={item.route}
            item={item}
            active={isRouteActive(pathname, item.route)}
            onPress={() => go(item.route)}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text
          style={[
            design.type.caption,
            { color: colors.textMuted, fontSize: 11 },
          ]}
        >
          v{Constants.expoConfig?.version ?? '—'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    marginHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});