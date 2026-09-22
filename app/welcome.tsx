// app/welcome.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { markOnboardingSeen } from '../lib/onboarding';

// Reanimated 4 no longer exports SharedValue from its public API.
// This local type is structurally identical to their internal one.
type SharedValue<T> = { value: T };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { colors } = useTheme();
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
    if (isLast) return finish();
    const next = Math.min(index + 1, SLIDES.length - 1);
    scrollRef.current?.scrollTo({
      x: next * SCREEN_WIDTH,
      animated: true,
    });
    setIndex(next);
  };

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/');
  };

  const skip = async () => {
    await markOnboardingSeen();
    router.replace('/');
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Floating background decorations */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {FLOATERS.map((f, i) => (
          <Floater key={i} {...f} color={colors.iconMuted} />
        ))}
      </View>

      {/* Skip */}
      <View style={styles.topBar}>
        <View />
        <Pressable onPress={skip} hitSlop={10} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
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
            scrollX={scrollX}
            colors={colors}
          />
        ))}
      </Animated.ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <Dot key={s.key} index={i} scrollX={scrollX} colors={colors} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryText }]}>
            {isLast ? 'Get started' : 'Next'}
          </Text>
          <Feather
            name={isLast ? 'check' : 'arrow-right'}
            size={18}
            color={colors.primaryText}
          />
        </Pressable>

        {!isLast && (
          <Pressable onPress={skip} style={styles.secondaryBtn}>
            <Text
              style={[styles.secondaryText, { color: colors.textSecondary }]}
            >
              Skip for now
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── One slide with scroll-driven parallax ───────────────
function SlideView({
  slide,
  index,
  scrollX,
  colors,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  colors: any;
}) {
  const input = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
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
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
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

// ── Icon circle with continuous pulse ───────────────────
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
  scrollX,
  colors,
}: {
  index: number;
  scrollX: SharedValue<number>;
  colors: any;
}) {
  const style = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
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

// ── Floating background icon ────────────────────────────
function Floater({
  icon,
  left,
  top,
  size,
  delay,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  left: number;
  top: number;
  size: number;
  delay: number;
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
          left: left * SCREEN_WIDTH,
          top: top * SCREEN_HEIGHT,
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
  dot: {
    height: 8,
    borderRadius: 4,
  },

  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '800' },

  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: { fontSize: 14, fontWeight: '600' },
});