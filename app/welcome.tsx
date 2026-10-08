// app/welcome.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../hooks/useProfile';
import { useLibrary } from '../hooks/useLibrary';
import { useHover } from '../hooks/useHover';
import { markOnboardingSeen } from '../lib/onboarding';
import {
  AVATAR_COLORS,
  persistAvatar,
  deleteAvatarFile,
} from '../lib/profile';
import ProfileAvatar from '../components/ProfileAvatar';

// Reanimated 4 no longer exports SharedValue from its public API.
type SharedValue<T> = { value: T };

type Stage = 'slides' | 'profile' | 'library' | 'done';

type Slide = {
  key: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: 'headphones',
    title: 'Welcome to\nMusicPlayer',
    body:
      'Your music, exactly where it belongs — on your device, in your hands, on your terms.',
  },
  {
    key: 'library',
    icon: 'music',
    title: 'Your library,\nbeautifully organized',
    body:
      'Every track sorted by title, artist, and album. Search across your whole collection in a tap.',
  },
  {
    key: 'play',
    icon: 'play-circle',
    title: 'Play anywhere,\ncontrol everything',
    body:
      'Background playback, lock-screen controls, and gesture-driven seeking. No ads. No accounts. Just music.',
  },
];

const FLOATERS = [
  { icon: 'music' as const, left: 0.1, top: 0.14, size: 20, delay: 0 },
  { icon: 'heart' as const, left: 0.86, top: 0.2, size: 14, delay: 800 },
  { icon: 'disc' as const, left: 0.14, top: 0.74, size: 22, delay: 400 },
  { icon: 'headphones' as const, left: 0.84, top: 0.8, size: 16, delay: 1200 },
];

export default function WelcomeScreen() {
  const { colors, design } = useTheme();
  const [stage, setStage] = useState<Stage>('slides');

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/');
  };

  // The Skip button is available on every stage and always means
  // "skip onboarding entirely". Individual stages have their own
  // Next / Back so users can move forward without finishing.
  const skip = finish;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Floating background decorations — only on slides, where
          they belong. The profile form needs a calmer backdrop. */}
      {stage === 'slides' && (
        <Floaters color={colors.iconMuted} />
      )}

      {stage !== 'done' && (
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={skip} hitSlop={10} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip
            </Text>
          </Pressable>
        </View>
      )}

      {stage === 'slides' && (
        <SlidesStage
          colors={colors}
          onDone={() => setStage('profile')}
        />
      )}

      {stage === 'profile' && (
        <ProfileStage
          onNext={() => setStage('library')}
          onBack={() => setStage('slides')}
          colors={colors}
          design={design}
        />
      )}

      {stage === 'library' && (
        <LibraryStage
          onNext={() => setStage('done')}
          onBack={() => setStage('profile')}
          colors={colors}
          design={design}
        />
      )}

      {stage === 'done' && (
        <DoneStage onFinish={finish} colors={colors} design={design} />
      )}
    </SafeAreaView>
  );
}

// ── Slides stage ────────────────────────────────────────
function SlidesStage({
  colors,
  onDone,
}: {
  colors: any;
  onDone: () => void;
}) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const scrollRef = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const handleMomentumEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const goNext = () => {
    if (isLast) return onDone();
    const next = Math.min(index + 1, SLIDES.length - 1);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setIndex(next);
  };

  return (
    <>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        decelerationRate="fast"
        bounces={false}
      >
        {SLIDES.map((slide, i) => (
          <SlideView
            key={slide.key}
            slide={slide}
            index={i}
            screenWidth={SCREEN_WIDTH}
            scrollX={scrollX}
            colors={colors}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <Dot
            key={s.key}
            index={i}
            screenWidth={SCREEN_WIDTH}
            scrollX={scrollX}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <PrimaryButton
          label={isLast ? 'Get started' : 'Next'}
          icon={isLast ? 'check' : 'arrow-right'}
          onPress={goNext}
          colors={colors}
        />
      </View>
    </>
  );
}

// ── Profile stage ───────────────────────────────────────
function ProfileStage({
  onNext,
  onBack,
  colors,
  design,
}: {
  onNext: () => void;
  onBack: () => void;
  colors: any;
  design: any;
}) {
  const { profile, update } = useProfile();
  const [name, setName] = useState(profile.name === 'there' ? '' : profile.name);
  const [username, setUsername] = useState(
    profile.username === 'username' ? '' : profile.username
  );
  const [bio, setBio] = useState(profile.bio);

  const commitAndNext = () => {
    const trimmedName = name.trim();
    if (trimmedName) update('name', trimmedName);
    const trimmedUser = username.trim().replace(/^@/, '');
    if (trimmedUser) update('username', trimmedUser);
    update('bio', bio.trim());
    onNext();
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photos permission needed',
        'Allow access to your photos to set a profile picture.',
        perm.canAskAgain
          ? undefined
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open settings', onPress: () => Linking.openSettings() },
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
      console.warn('[Welcome] avatar save failed:', e);
      Alert.alert('Could not set photo', 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.stageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stageInner}>
          <Text style={[styles.stageTitle, { color: colors.text }]}>
            Make it yours
          </Text>
          <Text style={[styles.stageSubtitle, { color: colors.textSecondary }]}>
            Set up your profile. You can change any of this later.
          </Text>

          <View style={styles.avatarWrap}>
            <Pressable onPress={pickAvatar} hitSlop={8}>
              <View>
                <ProfileAvatar
                  name={name || profile.name}
                  color={profile.avatarColor}
                  uri={profile.avatarUri}
                  size={112}
                  fontSize={44}
                />
                <View
                  style={[
                    styles.cameraBadge,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.background,
                    },
                  ]}
                >
                  <Feather
                    name="camera"
                    size={14}
                    color={colors.primaryText}
                  />
                </View>
              </View>
            </Pressable>
          </View>

          <Text
            style={[
              design.type.caption,
              { color: colors.textMuted, marginTop: 4, marginBottom: 8 },
            ]}
          >
            Tap to add a photo, or pick a color below
          </Text>

          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => update('avatarColor', c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  profile.avatarColor === c && {
                    borderColor: colors.text,
                    borderWidth: 3,
                  },
                ]}
              >
                {profile.avatarColor === c && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>

          <Field
            label="Your name"
            value={name}
            onChangeText={setName}
            placeholder="What should we call you?"
            autoCapitalize="words"
            colors={colors}
            design={design}
          />
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            autoCapitalize="none"
            prefix="@"
            colors={colors}
            design={design}
          />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="A short line about you"
            multiline
            maxLength={140}
            colors={colors}
            design={design}
          />
        </View>
      </ScrollView>

      <View style={styles.stageActions}>
        <SecondaryButton
          label="Back"
          onPress={onBack}
          colors={colors}
          design={design}
        />
        <PrimaryButton
          label="Continue"
          icon="arrow-right"
          onPress={commitAndNext}
          colors={colors}
          style={{ flex: 1 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Library access stage ────────────────────────────────
function LibraryStage({
  onNext,
  onBack,
  colors,
  design,
}: {
  onNext: () => void;
  onBack: () => void;
  colors: any;
  design: any;
}) {
  const { granted, loading, refresh, songs } = useLibrary();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.stageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stageInner, { alignItems: 'center' }]}>
          <View
            style={[
              styles.bigIcon,
              { backgroundColor: colors.rowActive },
            ]}
          >
            <Feather
              name={granted ? 'check-circle' : 'music'}
              size={48}
              color={colors.primary}
            />
          </View>

          <Text
            style={[
              styles.stageTitle,
              { color: colors.text, textAlign: 'center' },
            ]}
          >
            {granted ? "You're all set" : 'Find your music'}
          </Text>

          <Text
            style={[
              styles.stageSubtitle,
              { color: colors.textSecondary, textAlign: 'center' },
            ]}
          >
            {granted
              ? `${songs.length} ${
                  songs.length === 1 ? 'track' : 'tracks'
                } found on this device.`
              : 'MusicPlayer needs access to the audio files on this device. Nothing is uploaded anywhere — everything stays local.'}
          </Text>

          {!granted && (
            <Pressable
              onPress={refresh}
              disabled={loading}
              style={[
                styles.grantBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: design.radius.pill,
                },
                loading && { opacity: 0.6 },
              ]}
            >
              <Feather name="folder" size={18} color={colors.primaryText} />
              <Text
                style={[
                  design.type.body,
                  { color: colors.primaryText, fontWeight: '700' },
                ]}
              >
                {loading ? 'Requesting…' : 'Allow access'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={styles.stageActions}>
        <SecondaryButton
          label="Back"
          onPress={onBack}
          colors={colors}
          design={design}
        />
        <PrimaryButton
          label={granted ? 'Continue' : 'Skip for now'}
          icon={granted ? 'arrow-right' : undefined}
          onPress={onNext}
          colors={colors}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

// ── Done stage ──────────────────────────────────────────
function DoneStage({
  onFinish,
  colors,
  design,
}: {
  onFinish: () => void;
  colors: any;
  design: any;
}) {
  const { profile } = useProfile();

  const firstName = (() => {
    const trimmed = profile.name?.trim();
    if (!trimmed) return 'there';
    return trimmed.split(/\s+/)[0];
  })();

  return (
    <View style={[styles.doneWrap, { justifyContent: 'center' }]}>
      <View
        style={[styles.bigIcon, { backgroundColor: colors.rowActive }]}
      >
        <Feather name="check" size={48} color={colors.primary} />
      </View>

      <Text style={[styles.stageTitle, { color: colors.text }]}>
        Ready, {firstName}
      </Text>
      <Text
        style={[
          styles.stageSubtitle,
          { color: colors.textSecondary, textAlign: 'center' },
        ]}
      >
        Your library is set up. Start listening.
      </Text>

      <Pressable
        onPress={onFinish}
        style={[
          styles.grantBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: design.radius.pill,
            marginTop: 32,
          },
        ]}
      >
        <Feather name="play" size={18} color={colors.primaryText} />
        <Text
          style={[
            design.type.body,
            { color: colors.primaryText, fontWeight: '700' },
          ]}
        >
          Open MusicPlayer
        </Text>
      </Pressable>
    </View>
  );
}

// ── Reusable form field ─────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  multiline,
  maxLength,
  autoCapitalize,
  colors,
  design,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  colors: any;
  design: any;
}) {
  return (
    <View style={{ width: '100%', marginTop: 16 }}>
      <Text
        style={[
          design.type.caption,
          { color: colors.textMuted, marginBottom: 6, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.fieldWrap,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: design.radius.item,
          },
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {prefix && (
          <Text
            style={[
              design.type.body,
              { color: colors.textMuted, marginRight: 4 },
            ]}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.fieldInput,
            { color: colors.text },
            multiline && { minHeight: 66, textAlignVertical: 'top' },
          ]}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          maxLength={maxLength}
          returnKeyType={multiline ? 'default' : 'next'}
        />
      </View>
    </View>
  );
}

// ── Primary CTA button ──────────────────────────────────
function PrimaryButton({
  label,
  icon,
  onPress,
  colors,
  style,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  colors: any;
  style?: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.cta,
        { backgroundColor: colors.primary },
        hovered && { opacity: 0.9 },
        style,
      ]}
    >
      <Text style={[styles.ctaText, { color: colors.primaryText }]}>
        {label}
      </Text>
      {icon && (
        <Feather name={icon} size={18} color={colors.primaryText} />
      )}
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  colors,
  design,
}: {
  label: string;
  onPress: () => void;
  colors: any;
  design: any;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      style={[
        styles.secondaryCta,
        {
          backgroundColor: colors.chipBg,
          borderRadius: design.radius.pill,
        },
        hovered && { opacity: 0.9 },
      ]}
    >
      <Text
        style={[
          design.type.body,
          { color: colors.text, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Slide view with parallax ────────────────────────────
function SlideView({
  slide,
  index,
  screenWidth,
  scrollX,
  colors,
}: {
  slide: Slide;
  index: number;
  screenWidth: number;
  scrollX: SharedValue<number>;
  colors: any;
}) {
  const input = [
    (index - 1) * screenWidth,
    index * screenWidth,
    (index + 1) * screenWidth,
  ];

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      input,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      input,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }], opacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      input,
      [40, 0, 40],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      input,
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={[styles.slide, { width: screenWidth }]}>
      <Animated.View style={[styles.artWrap, iconStyle]}>
        <PulsingCircle colors={colors}>
          <Feather name={slide.icon} size={64} color={colors.primaryText} />
        </PulsingCircle>
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {slide.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {slide.body}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Pulsing icon circle ─────────────────────────────────
function PulsingCircle({
  colors,
  children,
}: {
  colors: any;
  children: React.ReactNode;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <View
        style={[styles.iconCircleOuter, { backgroundColor: colors.rowActive }]}
      >
        <View
          style={[styles.iconCircleInner, { backgroundColor: colors.primary }]}
        >
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Morphing dot ────────────────────────────────────────
function Dot({
  index,
  screenWidth,
  scrollX,
  colors,
}: {
  index: number;
  screenWidth: number;
  scrollX: SharedValue<number>;
  colors: any;
}) {
  const style = useAnimatedStyle(() => {
    const input = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];
    const width = interpolate(
      scrollX.value,
      input,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      input,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );
    return { width, opacity };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.primary }, style]}
    />
  );
}

// ── Floating decorations ────────────────────────────────
function Floaters({ color }: { color: string }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {FLOATERS.map((f, i) => (
        <Floater key={i} {...f} width={width} height={height} color={color} />
      ))}
    </View>
  );
}

function Floater({
  icon,
  left,
  top,
  size,
  delay,
  width,
  height,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  left: number;
  top: number;
  size: number;
  delay: number;
  width: number;
  height: number;
  color: string;
}) {
  const y = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      y.value = withRepeat(
        withSequence(
          withTiming(-18, {
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: left * width,
          top: top * height,
          opacity: 0.15,
        },
        style,
      ]}
    >
      <Feather name={icon} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 1,
  },
  skipBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  skipText: { fontSize: 14, fontWeight: '600' },

  // ── Slides ─────────────────────────────────────────
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  artWrap: {
    marginBottom: 56,
  },
  iconCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  textBlock: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    maxWidth: 320,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: { height: 8, borderRadius: 4 },

  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '800' },

  // ── Interactive stages ─────────────────────────────
  stageContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stageInner: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  stageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 12,
  },
  stageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 380,
  },

  avatarWrap: {
    alignItems: 'center',
    marginTop: 28,
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

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },

  stageActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  secondaryCta: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Library access + done ──────────────────────────
  bigIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 24,
  },

  doneWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});