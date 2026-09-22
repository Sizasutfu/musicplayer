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
import { useTheme } from '../../../context/ThemeContext';
import { clearCache } from '../../../lib/metadata';
import { resetOnboarding } from '../../../lib/onboarding';
import { useLibrary } from '../../../hooks/useLibrary';

type IconName = React.ComponentProps<typeof Feather>['name'];
type Colors = ReturnType<typeof useTheme>['colors'];
type Design = ReturnType<typeof useTheme>['design'];

export default function SettingsScreen() {
  const { settings, colors, design, updateSetting, resetSettings, loaded } =
    useTheme();
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
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetSettings(),
        },
      ]
    );
  };

  const runShowWelcome = () => {
    Alert.alert('Show welcome screen?', 'You will be taken back to onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Show',
        onPress: async () => {
          await resetOnboarding();
          router.replace('/welcome');
        },
      },
    ]);
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
        <Section title="Appearance" colors={colors} design={design}>
          <Row colors={colors} design={design} noDivider>
            <RowIcon name="moon" colors={colors} design={design} />
            <RowLabel colors={colors} design={design}>
              Theme
            </RowLabel>
          </Row>
          <View
            style={[
              styles.segmentRow,
              { gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
            ]}
          >
            {(['system', 'light', 'dark'] as const).map((mode) => {
              const active = settings.theme === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => updateSetting('theme', mode)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: colors.chipBg,
                      borderRadius: design.radius.item,
                    },
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      design.type.caption,
                      { color: colors.chipText, fontWeight: '600' },
                      active && {
                        color: colors.primaryText,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Playback" colors={colors} design={design}>
          <ToggleRow
            icon="play-circle"
            label="Continue playback"
            description="Keep playing when the app is closed"
            value={settings.continuePlaybackOnKill}
            onChange={(v) => updateSetting('continuePlaybackOnKill', v)}
            colors={colors}
            design={design}
          />
          <ToggleRow
            icon="headphones"
            label="Headphone controls"
            description="Pause and skip with your headset buttons"
            value={settings.headphoneControls}
            onChange={(v) => updateSetting('headphoneControls', v)}
            colors={colors}
            design={design}
          />
          <ToggleRow
            icon="skip-forward"
            label="Autoplay next track"
            description="Continue to the next song automatically"
            value={settings.autoplayNext}
            onChange={(v) => updateSetting('autoplayNext', v)}
            colors={colors}
            design={design}
            last
          />
        </Section>

        <Section title="Library" colors={colors} design={design}>
          <ActionRow
            icon="refresh-cw"
            label="Rescan library"
            description="Look for new audio files"
            busy={busy === 'rescan'}
            onPress={runRescan}
            colors={colors}
            design={design}
          />
          <ActionRow
            icon="trash-2"
            label="Clear metadata cache"
            description="Force a re-read of ID3 tags"
            busy={busy === 'clear-cache'}
            onPress={runClearCache}
            colors={colors}
            design={design}
          />
          <ToggleRow
            icon="eye-off"
            label="Show hidden files"
            description="Include files in hidden folders"
            value={settings.showHiddenFiles}
            onChange={(v) => updateSetting('showHiddenFiles', v)}
            colors={colors}
            design={design}
            last
          />
        </Section>

        <Section title="About" colors={colors} design={design}>
          <ActionRow
            icon="info"
            label="Version"
            description="1.0.0"
            colors={colors}
            design={design}
          />
          <ActionRow
            icon="play-circle"
            label="Show welcome screen again"
            description="Replay the onboarding flow"
            onPress={runShowWelcome}
            colors={colors}
            design={design}
          />
          <ActionRow
            icon="rotate-ccw"
            label="Reset settings"
            description="Return all preferences to defaults"
            destructive
            onPress={runResetSettings}
            colors={colors}
            design={design}
          />
          <ActionRow
            icon="file-text"
            label="Tracks in library"
            description={`${songs.length} on this device`}
            colors={colors}
            design={design}
            last
          />
        </Section>

        <Text style={[design.type.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 32 }]}>
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

function Row({
  colors,
  design,
  noDivider,
  children,
}: {
  colors: Colors;
  design: Design;
  noDivider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.row,
        !noDivider && design.showRowDividers && {
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
  design,
}: {
  name: IconName;
  destructive?: boolean;
  colors: Colors;
  design: Design;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        {
          backgroundColor: destructive
            ? 'rgba(239,68,68,0.12)'
            : colors.rowActive,
          borderRadius: design.radius.item - 2,
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
  design,
}: {
  children: React.ReactNode;
  destructive?: boolean;
  colors: Colors;
  design: Design;
}) {
  return (
    <Text
      style={[
        design.type.body,
        { color: destructive ? colors.danger : colors.text, fontWeight: '600' },
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
  design,
  last,
}: {
  icon: IconName;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && design.showRowDividers && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <RowIcon name={icon} colors={colors} design={design} />
      <View style={{ flex: 1 }}>
        <RowLabel colors={colors} design={design}>
          {label}
        </RowLabel>
        {description ? (
          <Text
            style={[
              design.type.caption,
              { color: colors.textMuted, marginTop: 2 },
            ]}
          >
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
  design,
  last,
}: {
  icon: IconName;
  label: string;
  description?: string;
  onPress?: () => void;
  busy?: boolean;
  destructive?: boolean;
  colors: Colors;
  design: Design;
  last?: boolean;
}) {
  const disabled = !onPress || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        !last && design.showRowDividers && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderSubtle,
        },
        pressed && onPress && { opacity: 0.6 },
      ]}
    >
      <RowIcon
        name={icon}
        destructive={destructive}
        colors={colors}
        design={design}
      />
      <View style={{ flex: 1 }}>
        <RowLabel destructive={destructive} colors={colors} design={design}>
          {label}
        </RowLabel>
        {description ? (
          <Text
            style={[
              design.type.caption,
              { color: colors.textMuted, marginTop: 2 },
            ]}
          >
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
  section: {},
  card: {
    marginHorizontal: 16,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
  },
});