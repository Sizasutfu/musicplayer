// app/welcome.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { markOnboardingSeen } from '../lib/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    title: 'Welcome to MusicPlayer',
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
      'Background playback, lock-screen controls, and gesture-driven seeking. No ads. No cloud. Just music.',
  },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const i = Math.round(offset / SCREEN_WIDTH);
    if (i !== index) setIndex(i);
  };

  const goNext = () => {
    if (isLast) return finish();
    const next = Math.min(index + 1, SLIDES.length - 1);
    listRef.current?.scrollToOffset({
      offset: next * SCREEN_WIDTH,
      animated: true,
    });
    setIndex(next);
  };

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/(drawer)');
  };

  const skip = async () => {
    await markOnboardingSeen();
    router.replace('/(drawer)');
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
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
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <SlideView slide={item} colors={colors} />
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <View
              key={s.key}
              style={[
                styles.dot,
                { backgroundColor: colors.border },
                active && {
                  backgroundColor: colors.primary,
                  width: 24,
                },
              ]}
            />
          );
        })}
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

function SlideView({
  slide,
  colors,
}: {
  slide: Slide;
  colors: any;
}) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.artWrap}>
        <View
          style={[
            styles.iconCircleOuter,
            { backgroundColor: colors.rowActive },
          ]}
        >
          <View
            style={[
              styles.iconCircleInner,
              { backgroundColor: colors.primary },
            ]}
          >
            <Feather
              name={slide.icon}
              size={64}
              color={colors.primaryText}
            />
          </View>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {slide.title}
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {slide.body}
      </Text>
    </View>
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
  },
  skipBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  skipText: { fontSize: 14, fontWeight: '600' },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  artWrap: {
    marginBottom: 48,
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

  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 320,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
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