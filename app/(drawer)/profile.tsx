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
type Design = ReturnType<typeof useTheme>['design'];
type IconName = React.ComponentProps<typeof Feather>['name'];

type EditField = 'name' | 'username' | 'bio' | null;

export default function ProfileScreen() {
  const { profile, loaded, update, reset } = useProfile();
  const { playlists } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();

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
        <View
          style={[
            design.card,
            styles.headerCard,
            { backgroundColor: colors.surface },
          ]}
        >
          <ProfileAvatar
            name={profile.name}
            color={profile.avatarColor}
            size={96}
            fontSize={38}
          />

          <Text
            style={[
              design.type.title,
              { color: colors.text, marginTop: 16, textAlign: 'center' },
            ]}
          >
            {profile.name}
          </Text>
          <Text
            style={[
              design.type.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            @{profile.username}
          </Text>
          {profile.bio ? (
            <Text
              style={[
                design.type.caption,
                {
                  color: colors.textMuted,
                  marginTop: 10,
                  textAlign: 'center',
                  paddingHorizontal: 16,
                  lineHeight: 19,
                },
              ]}
            >
              {profile.bio}
            </Text>
          ) : null}

          <Pressable
            onPress={() => openEdit('name')}
            style={({ pressed }) => [
              styles.editBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: design.radius.pill,
              },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="edit-2" size={14} color={colors.primaryText} />
            <Text
              style={[
                design.type.caption,
                { color: colors.primaryText, fontWeight: '700' },
              ]}
            >
              Edit profile
            </Text>
          </Pressable>
        </View>

        <Section title="Avatar color" colors={colors} design={design}>
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
                  {active && <Feather name="check" size={16} color="#fff" />}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Your library" colors={colors} design={design}>
          <View style={styles.statsRow}>
            <Stat
              icon="music"
              value={totalTracks}
              label={totalTracks === 1 ? 'Track' : 'Tracks'}
              colors={colors}
              design={design}
            />
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <Stat
              icon="list"
              value={totalPlaylists}
              label={totalPlaylists === 1 ? 'Playlist' : 'Playlists'}
              colors={colors}
              design={design}
            />
          </View>
        </Section>

        <Section title="Account" colors={colors} design={design}>
          <FieldRow
            icon="user"
            label="Display name"
            value={profile.name}
            onPress={() => openEdit('name')}
            colors={colors}
            design={design}
          />
          <FieldRow
            icon="at-sign"
            label="Username"
            value={`@${profile.username}`}
            onPress={() => openEdit('username')}
            colors={colors}
            design={design}
          />
          <FieldRow
            icon="align-left"
            label="Bio"
            value={profile.bio || 'Add a short bio'}
            onPress={() => openEdit('bio')}
            colors={colors}
            design={design}
            last
          />
        </Section>

        <Section title="More" colors={colors} design={design}>
          <ActionRow
            icon="settings"
            label="Settings"
            onPress={() => router.push('/settings')}
            colors={colors}
            design={design}
          />
          <ActionRow
            icon="rotate-ccw"
            label="Reset profile"
            destructive
            onPress={confirmReset}
            colors={colors}
            design={design}
            last
          />
        </Section>

        <Text
          style={[
            design.type.caption,
            {
              color: colors.textMuted,
              textAlign: 'center',
              marginTop: 32,
            },
          ]}
        >
          Joined{' '}
          {new Date(profile.joinedAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </ScrollView>

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
            style={[
              design.card,
              styles.modalCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                design.type.heading,
                { color: colors.text, marginBottom: 12 },
              ]}
            >
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
                  borderRadius: design.radius.item,
                },
                editField === 'bio' && {
                  minHeight: 90,
                  textAlignVertical: 'top',
                },
              ]}
              maxLength={editField === 'bio' ? 140 : 40}
              multiline={editField === 'bio'}
              returnKeyType={editField === 'bio' ? 'default' : 'done'}
              onSubmitEditing={editField === 'bio' ? undefined : submitEdit}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditField(null)}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.chipBg,
                    borderRadius: design.radius.item,
                  },
                ]}
              >
                <Text style={[design.type.body, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitEdit}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: design.radius.item,
                  },
                ]}
              >
                <Text
                  style={[design.type.body, { color: colors.primaryText }]}
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

function Section({
  title,
  colors,
  design,
  children,
}: {
  title: string;
  colors: Colors;
  design: Design;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { marginTop: design.spacing.section }]}>
      <Text
        style={[
          design.type.sectionLabel,
          { color: colors.textMuted, marginHorizontal: 20, marginBottom: 8 },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          design.card,
          styles.card,
          { backgroundColor: colors.surface },
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
  design,
}: {
  icon: IconName;
  value: number;
  label: string;
  colors: Colors;
  design: Design;
}) {
  return (
    <View style={styles.stat}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: colors.rowActive },
        ]}
      >
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[design.type.title, { color: colors.text }]}>{value}</Text>
      <Text style={[design.type.caption, { color: colors.textMuted }]}>
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
  design,
  last,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last &&
          design.showRowDividers && {
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
            backgroundColor: colors.rowActive,
            borderRadius: design.radius.item - 2,
          },
        ]}
      >
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[design.type.caption, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            design.type.body,
            { color: colors.text, marginTop: 2, fontWeight: '600' },
          ]}
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
  design,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last &&
          design.showRowDividers && {
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
            borderRadius: design.radius.item - 2,
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
          design.type.body,
          {
            flex: 1,
            color: destructive ? colors.danger : colors.text,
            fontWeight: '600',
          },
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
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },

  section: {},
  card: {
    marginHorizontal: 16,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 22,
  },
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});