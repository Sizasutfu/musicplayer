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
import ProfileAvatar from './ProfileAvatar';

type Item = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  /** URL-form route. Matches what usePathname() returns. */
  route: string;
  /** Also match these prefix paths for active highlighting. */
  matchPrefix?: string;
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

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { colors, design } = useTheme();
  const { profile } = useProfile();
  const pathname = usePathname();

  const goToProfile = () => {
    router.push('/(drawer)/profile');
    // With a permanent drawer on wide screens, closeDrawer is a
    // no-op. Fine to call unconditionally.
    props.navigation.closeDrawer();
  };

  const go = (route: string) => {
    router.push(route as any);
    props.navigation.closeDrawer();
  };

  const isActive = (item: Item) => {
    const urlPath = toUrlPath(item.route);

    // Home matches only the exact root — otherwise every route
    // "starts with /" and Home would always be highlighted.
    if (urlPath === '/') {
      return pathname === '/' || pathname === '';
    }

    // Everything else matches itself or a nested path underneath
    // (e.g., /playlist/123 still highlights /playlists via the
    // matchPrefix override if you add one).
    return pathname === urlPath || pathname.startsWith(urlPath + '/');
  };

  const renderItem = (item: Item) => {
    const active = isActive(item);
    return (
      <Pressable
        key={item.route}
        onPress={() => go(item.route)}
        style={({ pressed }) => [
          styles.row,
          {
            borderRadius: design.radius.item,
            marginBottom: design.spacing.item - 10,
          },
          active && { backgroundColor: colors.rowActive },
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
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surface }]}
      edges={['top', 'bottom']}
    >
      <Pressable
        onPress={goToProfile}
        style={({ pressed }) => [
          styles.profileHeader,
          pressed && { opacity: 0.7 },
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
        {PRIMARY.map(renderItem)}

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
        {BROWSE.map(renderItem)}
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