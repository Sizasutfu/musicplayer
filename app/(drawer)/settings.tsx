// app/(drawer)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { clearCache } from '../../lib/metadata';
import { resetOnboarding } from '../../lib/onboarding';
import { useLibrary } from '../../hooks/useLibrary';

type IconName = React.ComponentProps<typeof Feather>['name'];
type Colors = ReturnType<typeof useTheme>['colors'];

export default function SettingsScreen() {
  const { settings, colors, updateSetting, resetSettings, loaded } = useTheme();
  const { refresh, songs } = useLibrary();
  const [busy, setBusy] = useState<string | null>(null);

  const runClearCache = async () => {
    setBusy('clear-cache');
    try {
      await clearCache();
      Alert.alert('Done', 'Metadata cache cleared.');
    } finally {
      setBusy(null);
    }
  };

  const runRescan = async () => {
    setBusy('rescan');
    try {
      await refresh();
      Alert.alert('Done', `Rescanned library — ${songs.length} tracks found.`);
    } finally {
      setBusy(null);
    }
  };

  const runResetSettings = () => {
    Alert.alert(
      'Reset settings?',
      'All preferences will return to their defaults. Your music is untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetSettings() },
      ]
    );
  };

  const runShowWelcome = () => {
    Alert.alert(
      'Show welcome screen?',
      'You will be taken back to the onboarding flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/welcome');
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

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.surfaceElevated }]}
      edges={['left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Appearance" colors={colors}>
          <Row colors={colors} noDivider>
            <RowIcon name="moon" colors={colors} />
            <RowLabel colors={colors}>Theme</RowLabel>
          </Row>
          <View style={styles.segmentRow}>
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const active = settings.theme === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => updateSetting('theme', mode)}
                  style={[
                    styles.segment,
                    { backgroundColor: colors.chipBg },
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: colors.chipText },
                      active && { color: colors.primaryText },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Playback" colors={colors}>
          <ToggleRow
            icon="play-circle"
            label="Continue playback"
            description="Keep playing when the app is closed"
            value={settings.continuePlaybackOnKill}
            onChange={(v) => updateSetting('continuePlaybackOnKill', v)}
            colors={colors}
          />
          <ToggleRow
            icon="headphones"
            label="Headphone controls"
            description="Pause and skip with your headset buttons"
            value={settings.headphoneControls}
            onChange={(v) => updateSetting('headphoneControls', v)}
            colors={colors}
          />
          <ToggleRow
            icon="skip-forward"
            label="Autoplay next track"
            description="Continue to the next song automatically"
            value={settings.autoplayNext}
            onChange={(v) => updateSetting('autoplayNext', v)}
            colors={colors}
            last
          />
        </Section>

        <Section title="Library" colors={colors}>
          <ActionRow
            icon="refresh-cw"
            label="Rescan library"
            description="Look for new audio files"
            busy={busy === 'rescan'}
            onPress={runRescan}
            colors={colors}
          />
          <ActionRow
            icon="trash-2"
            label="Clear metadata cache"
            description="Force a re-read of ID3 tags"
            busy={busy === 'clear-cache'}
            onPress={runClearCache}
            colors={colors}
          />
          <ToggleRow
            icon="eye-off"
            label="Show hidden files"
            description="Include files in hidden folders"
            value={settings.showHiddenFiles}
            onChange={(v) => updateSetting('showHiddenFiles', v)}
            colors={colors}
            last
          />
        </Section>

        <Section title="About" colors={colors}>
          <ActionRow
            icon="info"
            label="Version"
            description="1.0.0"
            colors={colors}
          />
          <ActionRow
            icon="play-circle"
            label="Show welcome screen again"
            description="Replay the onboarding flow"
            onPress={runShowWelcome}
            colors={colors}
          />
          <ActionRow
            icon="rotate-ccw"
            label="Reset settings"
            description="Return all preferences to defaults"
            destructive
            onPress={runResetSettings}
            colors={colors}
          />
          <ActionRow
            icon="file-text"
            label="Tracks in library"
            description={`${songs.length} on this device`}
            colors={colors}
            last
          />
        </Section>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Made with React Native + Expo
        </Text>
      </ScrollView>
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

function Row({
  colors,
  noDivider,
  children,
}: {
  colors: Colors;
  noDivider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.row,
        !noDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      {children}
    </View>
  );
}

function RowIcon({
  name,
  destructive,
  colors,
}: {
  name: IconName;
  destructive?: boolean;
  colors: Colors;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: destructive
            ? 'rgba(239,68,68,0.12)'
            : colors.rowActive,
        },
      ]}
    >
      <Feather
        name={name}
        size={16}
        color={destructive ? colors.danger : colors.primary}
      />
    </View>
  );
}

function RowLabel({
  children,
  destructive,
  colors,
}: {
  children: React.ReactNode;
  destructive?: boolean;
  colors: Colors;
}) {
  return (
    <Text
      style={[
        styles.label,
        { color: destructive ? colors.danger : colors.text },
      ]}
    >
      {children}
    </Text>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
  colors,
  last,
}: {
  icon: IconName;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: Colors;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <RowIcon name={icon} colors={colors} />
      <View style={{ flex: 1 }}>
        <RowLabel colors={colors}>{label}</RowLabel>
        {description ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.chipBg, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ActionRow({
  icon,
  label,
  description,
  onPress,
  busy,
  destructive,
  colors,
  last,
}: {
  icon: IconName;
  label: string;
  description?: string;
  onPress?: () => void;
  busy?: boolean;
  destructive?: boolean;
  colors: Colors;
  last?: boolean;
}) {
  const disabled = !onPress || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
        pressed && onPress && { opacity: 0.6 },
      ]}
    >
      <RowIcon name={icon} destructive={destructive} colors={colors} />
      <View style={{ flex: 1 }}>
        <RowLabel destructive={destructive} colors={colors}>
          {label}
        </RowLabel>
        {description ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.textMuted} />
      ) : onPress ? (
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 8, paddingBottom: 40 },

  section: { marginTop: 20 },
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 12, marginTop: 2 },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '600' },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },
});