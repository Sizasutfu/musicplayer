// components/WaveformVisualizer.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Reanimated 4 no longer exports SharedValue from the top level.
// This structural type matches their internal one.
type SharedValue<T> = { value: T };

const BAR_COUNT = 64;
const CYCLE_MS = 2600; // one full period of the underlying slow wave

type Props = {
  playing: boolean;
  color: string;
  height?: number;
  opacity?: number;
  seed?: number;
};

// Frequency-response-style envelope: heavier in the low/low-mid range,
// rolling off toward the highs — this is the shape that actually makes
// it read as an EQ spectrum instead of a flat oscilloscope line.
function envelopeAt(index: number, count: number) {
  const x = index / (count - 1);
  const rolloff = 0.3 + 0.7 * Math.exp(-x * 1.8);
  const ripple = 0.92 + 0.08 * Math.sin(x * 11 + 0.6);
  return rolloff * ripple;
}

// Fast attack, slower decay, random hop targets — the "punchy" spectrum-
// analyzer motion, driven per-bar so neighboring bins don't move in lockstep.
function useJitter(range: number, active: boolean) {
  const value = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(value);
      value.value = withTiming(0, { duration: 350 });
      return;
    }

    let mounted = true;

    const hop = () => {
      if (!mounted) return;
      const next = Math.random() * range;
      const rising = next > value.value;
      value.value = withTiming(
        next,
        {
          duration: rising
            ? 70 + Math.random() * 110
            : 220 + Math.random() * 260,
          easing: rising ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        },
        (finished) => {
          'worklet';
          if (finished) runOnJS(hop)();
        }
      );
    };

    hop();

    return () => {
      mounted = false;
      cancelAnimation(value);
    };
  }, [active, range]);

  return value;
}

function Bar({
  index,
  count,
  clock,
  amplitude,
  color,
  seed,
  playing,
}: {
  index: number;
  count: number;
  clock: SharedValue<number>;
  amplitude: SharedValue<number>;
  color: string;
  seed: number;
  playing: boolean;
}) {
  const phase = (index / (count - 1)) * Math.PI * 2;
  const env = envelopeAt(index, count);
  const jitter = useJitter(0.42 * env, playing);

  // Low-end bars get the kick pulse. Everything below 25% of the strip.
  const isLowEnd = index < count * 0.25;

  const style = useAnimatedStyle(() => {
    const t = clock.value + seed;
    const a = amplitude.value;

    // Slow underlying drift so the envelope shape isn't perfectly static.
    const drift =
      0.08 * Math.sin(t * 1.1 + phase * 1.3) +
      0.05 * Math.sin(t * 2.3 + phase * 2.1);

    // Sharp kick on the low end — a raised-cosine spike that hits every
    // ~1/3 of the clock cycle. The pow(..., 6) is what makes it punchy
    // instead of a smooth swell.
    const kick = isLowEnd
      ? 0.28 * Math.pow(Math.max(0, Math.sin(t * 3.5)), 6)
      : 0;

    const raw = env * (0.5 + drift + kick) + jitter.value;
    const clamped = Math.max(0.03, Math.min(1, raw * a + 0.03 * (1 - a)));

    // High-end bars sit slightly dimmer — mirrors how real spectrum
    // analyzers show less energy above 8kHz.
    const barOpacity = 0.4 + 0.6 * env;

    return {
      height: `${clamped * 100}%`,
      opacity: barOpacity * a + 0.5 * (1 - a),
    };
  });

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          marginHorizontal: 0.75,
          backgroundColor: color,
          borderTopLeftRadius: 1.5,
          borderTopRightRadius: 1.5,
        },
        style,
      ]}
    />
  );
}

export default function WaveformVisualizer({
  playing,
  color,
  height = 72,
  opacity = 1,
  seed = 0,
}: Props) {
  const clock = useSharedValue(0);
  const amplitude = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      amplitude.value = withTiming(1, { duration: 400 });
      clock.value = withRepeat(
        withTiming(Math.PI * 2, {
          duration: CYCLE_MS,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(clock);
      amplitude.value = withTiming(0, { duration: 400 });
    }
  }, [playing]);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          opacity,
          // Faint baseline under the bars — gives the strip a floor.
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: color + '40',
        },
      ]}
      pointerEvents="none"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Bar
          key={i}
          index={i}
          count={BAR_COUNT}
          clock={clock}
          amplitude={amplitude}
          color={color}
          seed={seed}
          playing={playing}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
});