// app/(drawer)/profile.tsx
import React, { useMemo, useState } from 'react';
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
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../hooks/useProfile';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useLibrary } from '../../hooks/useLibrary';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderBack } from '../../hooks/useHeaderBack';
import { useHover } from '../../hooks/useHover';
import {
  AVATAR_COLORS,
  deleteAvatarFile,
  persistAvatar,
} from '../../lib/profile';
import ProfileAvatar from '../../components/ProfileAvatar';
import MiniPlayer from '../../components/MiniPlayer';

type Colors = ReturnType<typeof useTheme>['colors'];
type Design = ReturnType<typeof useTheme>['design'];
type IconName = React.ComponentProps<typeof Feather>['name'];

type EditField = 'name' | 'username' | 'bio' | null;

// Profile is a form with a large avatar header and short sections.
// Cap at 720 like Settings — narrower than the list screens so
// rows don't stretch across a wide browser.
const CONTENT_MAX_WIDTH = 720;

// ── Responsive sizing ──────────────────────────────────
type Layout = {
  hPad: number;          // horizontal gutter for cards
  avatarSize: number;
  sectionPad: number;    // inner card padding
  rowVPad: number;
};

function layoutFor(width: number): Layout {
  if (width < 500) {
    return { hPad: 16, avatarSize: 96, sectionPad: 24, rowVPad: 14 };
  }
  if (width < 900) {
    return { hPad: 24, avatarSize: 112, sectionPad: 28, rowVPad: 14 };
  }
  return { hPad: 32, avatarSize: 128, sectionPad: 32, rowVPad: 16 };
}

export default function ProfileScreen() {
  const { profile, loaded, update, reset } = useProfile();
  const { playlists } = usePlaylists();
  const { songs } = useLibrary();
  const { colors, design } = useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const L = useMemo(() => layoutFor(width), [width]);

  const [editField, setEditField] = useState<EditField>(null);
  const [draft, setDraft] = useState('');

  useHeaderBack('Profile');

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

  // ── Avatar handling ────────────────────────────────────
  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photos permission needed',
        'Allow access to your photos to set a profile picture.',
        perm.canAskAgain
          ? undefined
          : [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open settings',
                onPress: () => Linking.openSettings(),
              },
            ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const sourceUri = result.assets[0]?.uri;
    if (!sourceUri) return;

    try {
      const persisted = await persistAvatar(sourceUri);
      await deleteAvatarFile(profile.avatarUri);
      update('avatarUri', persisted);
    } catch (e) {
      console.warn('[Profile] avatar save failed:', e);
      Alert.alert('Could not set photo', 'Please try again.');
    }
  };

  const removeAvatar = async () => {
    await deleteAvatarFile(profile.avatarUri);
    update('avatarUri', undefined);
  };

  const openAvatarMenu = () => {
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: 'Choose from library', onPress: handlePickAvatar },
    ];
    if (profile.avatarUri) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: removeAvatar,
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', undefined, buttons);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset profile?',
      'Your name, avatar, and bio will be reset to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await deleteAvatarFile(profile.avatarUri);
            reset();
          },
        },
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
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: '100%',
            maxWidth: isWide ? CONTENT_MAX_WIDTH : width,
            alignSelf: 'center',
          }}
        >
          {/* ── Header card ───────────────────────────── */}
          <View
            style={[
              design.card,
              {
                backgroundColor: colors.surface,
                marginHorizontal: L.hPad,
                padding: L.sectionPad,
                alignItems: 'center',
              },
            ]}
          >
            <AvatarPressable
              onPress={openAvatarMenu}
              profile={profile}
              size={L.avatarSize}
              colors={colors}
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

            <EditProfileButton
              onPress={() => openEdit('name')}
              colors={colors}
              design={design}
            />
          </View>

          <Section
            title="Avatar color"
            hPad={L.hPad}
            colors={colors}
            design={design}
          >
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((c) => (
                <ColorDot
                  key={c}
                  color={c}
                  active={profile.avatarColor === c}
                  onPress={() => update('avatarColor', c)}
                  colors={colors}
                />
              ))}
            </View>
          </Section>

          <Section
            title="Your library"
            hPad={L.hPad}
            colors={colors}
            design={design}
          >
            <View style={styles.statsRow}>
              <Stat
                icon="music"
                value={totalTracks}
                label={totalTracks === 1 ? 'Track' : 'Tracks'}
                colors={colors}
                design={design}
              />
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.border },
                ]}
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

          <Section
            title="Account"
            hPad={L.hPad}
            colors={colors}
            design={design}
          >
            <FieldRow
              icon="user"
              label="Display name"
              value={profile.name}
              onPress={() => openEdit('name')}
              rowVPad={L.rowVPad}
              colors={colors}
              design={design}
            />
            <FieldRow
              icon="at-sign"
              label="Username"
              value={`@${profile.username}`}
              onPress={() => openEdit('username')}
              rowVPad={L.rowVPad}
              colors={colors}
              design={design}
            />
            <FieldRow
              icon="align-left"
              label="Bio"
              value={profile.bio || 'Add a short bio'}
              onPress={() => openEdit('bio')}
              rowVPad={L.rowVPad}
              colors={colors}
              design={design}
              last
            />
          </Section>

          <Section
            title="More"
            hPad={L.hPad}
            colors={colors}
            design={design}
          >
            <ActionRow
              icon="settings"
              label="Settings"
              onPress={() => router.push('/settings')}
              rowVPad={L.rowVPad}
              colors={colors}
              design={design}
            />
            <ActionRow
              icon="rotate-ccw"
              label="Reset profile"
              destructive
              onPress={confirmReset}
              rowVPad={L.rowVPad}
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
        </View>
      </ScrollView>

      <Modal
        visible={!!editField}
        transparent
        animationType="fade"
        onRequestClose={() => setEditField(null)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setEditField(null)}
          />

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
                onSubmitEditing={
                  editField === 'bio' ? undefined : submitEdit
                }
              />

              <View style={styles.modalActions}>
                <ModalButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setEditField(null)}
                  colors={colors}
                  design={design}
                />
                <ModalButton
                  label="Save"
                  variant="primary"
                  onPress={submitEdit}
                  colors={colors}
                  design={design}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <MiniPlayer />
    </SafeAreaView>
  );
}

// ── Avatar pressable ────────────────────────────────────
function AvatarPressable({
  onPress,
  profile,
  size,
  colors,
}: {
  onPress: () => void;
  profile: any;
  size: number;
  colors: Colors;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      hitSlop={8}
      style={[
        hovered && isWeb && { opacity: 0.9 },
      ]}
    >
      <View>
        <ProfileAvatar
          name={profile.name}
          color={profile.avatarColor}
          uri={profile.avatarUri}
          size={size}
          fontSize={Math.round(size * 0.4)}
        />
        <View
          style={[
            styles.cameraBadge,
            {
              backgroundColor: colors.primary,
              borderColor: colors.surface,
            },
          ]}
        >
          <Feather
            name="camera"
            size={Math.round(size >= 112 ? 16 : 14)}
            color={colors.primaryText}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ── Edit profile button ─────────────────────────────────
function EditProfileButton({
  onPress,
  colors,
  design,
}: {
  onPress: () => void;
  colors: Colors;
  design: Design;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.editBtn,
        {
          backgroundColor: colors.primary,
          borderRadius: design.radius.pill,
        },
        hovered && { opacity: 0.9 },
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
  );
}

// ── Color dot ───────────────────────────────────────────
function ColorDot({
  color,
  active,
  onPress,
  colors,
}: {
  color: string;
  active: boolean;
  onPress: () => void;
  colors: Colors;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.colorDot,
        { backgroundColor: color },
        active && {
          borderColor: colors.text,
          borderWidth: 3,
        },
        hovered && isWeb && !active && {
          borderColor: colors.text,
          borderWidth: 2,
        },
      ]}
    >
      {active && <Feather name="check" size={16} color="#fff" />}
    </Pressable>
  );
}

// ── Modal button ────────────────────────────────────────
function ModalButton({
  label,
  variant,
  onPress,
  colors,
  design,
}: {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  colors: Colors;
  design: Design;
}) {
  const { hovered, hoverProps } = useHover();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.modalBtn,
        {
          backgroundColor: isPrimary ? colors.primary : colors.chipBg,
          borderRadius: design.radius.item,
        },
        hovered && { opacity: 0.9 },
      ]}
    >
      <Text
        style={[
          design.type.body,
          { color: isPrimary ? colors.primaryText : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Section wrapper ─────────────────────────────────────
function Section({
  title,
  hPad,
  colors,
  design,
  children,
}: {
  title: string;
  hPad: number;
  colors: Colors;
  design: Design;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { marginTop: design.spacing.section }]}>
      <Text
        style={[
          design.type.sectionLabel,
          { color: colors.textMuted, marginHorizontal: hPad, marginBottom: 8 },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          design.card,
          {
            backgroundColor: colors.surface,
            marginHorizontal: hPad,
            overflow: 'hidden',
          },
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
        style={[styles.statIcon, { backgroundColor: colors.rowActive }]}
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

// ── Field row ───────────────────────────────────────────
function FieldRow({
  icon,
  label,
  value,
  onPress,
  rowVPad,
  colors,
  design,
  last,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
  rowVPad: number;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.row,
        { paddingVertical: rowVPad },
        !last &&
          design.showRowDividers && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderSubtle,
          },
        hovered && isWeb && { backgroundColor: colors.surfaceElevated },
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
      <View style={{ flex: 1, minWidth: 0 }}>
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

// ── Action row ──────────────────────────────────────────
function ActionRow({
  icon,
  label,
  onPress,
  destructive,
  rowVPad,
  colors,
  design,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  rowVPad: number;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  const { hovered, hoverProps } = useHover();
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.row,
        { paddingVertical: rowVPad },
        !last &&
          design.showRowDividers && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.borderSubtle,
          },
        hovered && isWeb && { backgroundColor: colors.surfaceElevated },
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

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },

  section: {},

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
    borderWidth: 0,
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
    minHeight: 60,
  },
  rowIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Edit modal ───────────────────────────────────────
  modalOverlay: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '100%',
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