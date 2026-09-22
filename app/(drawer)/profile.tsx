// app/(drawer)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useLibrary } from '../../hooks/useLibrary';
import { useTheme } from '../../context/ThemeContext';
import { AVATAR_COLORS } from '../../lib/profile';
import ProfileAvatar from '../../components/ProfileAvatar';
import MiniPlayer from '../../components/MiniPlayer';

type Colors = ReturnType<typeof useTheme>['colors'];
type IconName = React.ComponentProps<typeof Feather>['name'];

type EditField = 'name' | 'username' | 'bio' | null;

export default function ProfileScreen() {
  const { profile, loaded, update, reset } = useProfile();
  const { playlists } = usePlaylists();
  const { songs } = useLibrary();
  const { colors } = useTheme();

  const [editField, setEditField] = useState<EditField>(null);
  const [draft, setDraft] = useState('');

  const openEdit = (field: Exclude<EditField, null>) => {
    setEditField(field);
    setDraft(profile[field]);
  };

  const submitEdit = () => {
    if (!editField) return;
    const value = draft.trim();
    if (editField === 'name' && !value) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    update(editField, value || (editField === 'bio' ? '' : profile[editField]));
    setEditField(null);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset profile?',
      'Your name, avatar, and bio will be reset to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => reset() },
      ]
    );
  };

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalTracks = songs.length;
  const totalPlaylists = playlists.length;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surfaceElevated }]}
      edges={['left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ──────────────────────────────── */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ProfileAvatar
            name={profile.name}
            color={profile.avatarColor}
            size={96}
            fontSize={38}
          />

          <Text style={[styles.name, { color: colors.text }]}>
            {profile.name}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{profile.username}
          </Text>
          {profile.bio ? (
            <Text style={[styles.bio, { color: colors.textMuted }]}>
              {profile.bio}
            </Text>
          ) : null}

          <Pressable
            onPress={() => openEdit('name')}
            style={({ pressed }) => [
              styles.editBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="edit-2" size={14} color={colors.primaryText} />
            <Text style={[styles.editBtnText, { color: colors.primaryText }]}>
              Edit profile
            </Text>
          </Pressable>
        </View>

        {/* ── Avatar color ─────────────────────────────── */}
        <Section title="Avatar color" colors={colors}>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => {
              const active = profile.avatarColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => update('avatarColor', c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    active && {
                      borderColor: colors.text,
                      borderWidth: 3,
                    },
                  ]}
                >
                  {active && (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Statistics ───────────────────────────────── */}
        <Section title="Your library" colors={colors}>
          <View style={styles.statsRow}>
            <Stat
              icon="music"
              value={totalTracks}
              label={totalTracks === 1 ? 'Track' : 'Tracks'}
              colors={colors}
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <Stat
              icon="list"
              value={totalPlaylists}
              label={totalPlaylists === 1 ? 'Playlist' : 'Playlists'}
              colors={colors}
            />
          </View>
        </Section>

        {/* ── Edit fields ──────────────────────────────── */}
        <Section title="Account" colors={colors}>
          <FieldRow
            icon="user"
            label="Display name"
            value={profile.name}
            onPress={() => openEdit('name')}
            colors={colors}
          />
          <FieldRow
            icon="at-sign"
            label="Username"
            value={`@${profile.username}`}
            onPress={() => openEdit('username')}
            colors={colors}
          />
          <FieldRow
            icon="align-left"
            label="Bio"
            value={profile.bio || 'Add a short bio'}
            onPress={() => openEdit('bio')}
            colors={colors}
            last
          />
        </Section>

        {/* ── Actions ──────────────────────────────────── */}
        <Section title="More" colors={colors}>
          <ActionRow
            icon="settings"
            label="Settings"
            onPress={() => router.push('/settings')}
            colors={colors}
          />
          <ActionRow
            icon="rotate-ccw"
            label="Reset profile"
            destructive
            onPress={confirmReset}
            colors={colors}
            last
          />
        </Section>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Joined{' '}
          {new Date(profile.joinedAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </ScrollView>

      {/* ── Edit modal ─────────────────────────────────── */}
      <Modal
        visible={!!editField}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setEditField(null)}
          />
          <View
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editField === 'name' && 'Display name'}
              {editField === 'username' && 'Username'}
              {editField === 'bio' && 'Bio'}
            </Text>

            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              placeholder={
                editField === 'name'
                  ? 'Your name'
                  : editField === 'username'
                  ? 'username'
                  : 'Say something short…'
              }
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
                editField === 'bio' && { minHeight: 90, textAlignVertical: 'top' },
              ]}
              maxLength={editField === 'bio' ? 140 : 40}
              multiline={editField === 'bio'}
              returnKeyType={editField === 'bio' ? 'default' : 'done'}
              onSubmitEditing={editField === 'bio' ? undefined : submitEdit}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditField(null)}
                style={[styles.modalBtn, { backgroundColor: colors.chipBg }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitEdit}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.modalBtnText, { color: colors.primaryText }]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <MiniPlayer />
    </SafeAreaView>
  );
}

// ── Building blocks ──────────────────────────────────────

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: Colors;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
  colors,
}: {
  icon: IconName;
  value: number;
  label: string;
  colors: Colors;
}) {
  return (
    <View style={styles.stat}>
      <View
        style={[styles.statIcon, { backgroundColor: colors.rowActive }]}
      >
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

function FieldRow({
  icon,
  label,
  value,
  onPress,
  colors,
  last,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
  colors: Colors;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.rowActive }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.rowValue, { color: colors.text }]}
        >
          {value}
        </Text>
      </View>
      <Feather name="edit-2" size={16} color={colors.iconMuted} />
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
  colors,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  colors: Colors;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: destructive
              ? 'rgba(239,68,68,0.12)'
              : colors.rowActive,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={destructive ? colors.danger : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { flex: 1, color: destructive ? colors.danger : colors.text },
        ]}
      >
        {label}
      </Text>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 12, paddingBottom: 40 },

  headerCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  username: { fontSize: 14, marginTop: 2 },
  bio: {
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 19,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  editBtnText: { fontSize: 13, fontWeight: '700' },

  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    justifyContent: 'center',
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 60,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 60,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 13, marginTop: 2 },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '86%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 12 },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});