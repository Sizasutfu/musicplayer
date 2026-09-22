// components/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { type DrawerContentComponentProps } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import ProfileAvatar from './ProfileAvatar';

const NAV_ITEMS = [
  { name: 'index', label: 'Library', icon: 'music' as const, route: '/' },
  { name: 'albums', label: 'Albums', icon: 'disc' as const, route: '/albums' },
  { name: 'artists', label: 'Artists', icon: 'user' as const, route: '/artists' },
  { name: 'playlists', label: 'Playlists', icon: 'list' as const, route: '/playlists' },
  { name: 'settings', label: 'Settings', icon: 'settings' as const, route: '/settings' },
];

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { colors, design } = useTheme();
  const { profile } = useProfile();
  const activeRoute = props.state.routeNames[props.state.index];

  const goToProfile = () => {
    router.push('/profile');
    props.navigation.closeDrawer();
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surface }]}
      edges={['top', 'bottom']}
    >
      {/* Profile header */}
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
        {NAV_ITEMS.map((item) => {
          const active = activeRoute === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => {
                router.push(item.route as any);
                props.navigation.closeDrawer();
              }}
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
        })}

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
          PLAYLISTS
        </Text>

        {['Recently Added', 'Favorites', 'Downloaded'].map((name) => (
          <Pressable
            key={name}
            style={({ pressed }) => [
              styles.playlistRow,
              { borderRadius: design.radius.item - 2 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Feather name="folder" size={16} color={colors.iconMuted} />
            <Text
              style={[
                design.type.caption,
                { color: colors.textSecondary },
              ]}
            >
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text
          style={[
            design.type.caption,
            { color: colors.textMuted, fontSize: 11 },
          ]}
        >
          v1.0.0
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

  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});