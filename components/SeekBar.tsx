// components/SeekBar.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

type Props = {
  position: number;      // current position in seconds
  duration: number;      // total duration in seconds
  onSeek: (seconds: number) => void;
  onSeekingChange?: (seeking: boolean) => void;
};

export default function SeekBar({
  position,
  duration,
  onSeek,
  onSeekingChange,
}: Props) {
  const { colors } = useTheme();

  const width = useSharedValue(0);
  const progress = useSharedValue(0);   // 0..1
  const isDragging = useSharedValue(0);

  // Sync external position into the shared value (unless dragging)
  useEffect(() => {
    if (isDragging.value === 1) return;
    if (duration > 0) {
      progress.value = Math.min(1, Math.max(0, position / duration));
    }
  }, [position, duration]);

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
  };

  const setSeeking = (v: boolean) => {
    onSeekingChange?.(v);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      isDragging.value = 1;
      runOnJS(setSeeking)(true);
      if (width.value > 0) {
        progress.value = Math.min(1, Math.max(0, e.x / width.value));
      }
    })
    .onUpdate((e) => {
      if (width.value > 0) {
        progress.value = Math.min(1, Math.max(0, e.x / width.value));
      }
    })
    .onEnd(() => {
      const seconds = progress.value * duration;
      runOnJS(onSeek)(seconds);
    })
    .onFinalize(() => {
      isDragging.value = 0;
      runOnJS(setSeeking)(false);
    });

  const trackStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.hitArea} onLayout={onLayout}>
        <View
          style={[styles.track, { backgroundColor: colors.border }]}
        >
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: colors.primary },
              trackStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: colors.primary },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    top: 9,
  },
});