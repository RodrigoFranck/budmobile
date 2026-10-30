import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanResponder,
  View,
  useWindowDimensions,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { motion, useV3Colors } from '@/theme';

const TRACK_WIDTH = 300;
const TRACK_HEIGHT = 2;
const TICK_WIDTH = 2;
const TICK_HEIGHT = 20;
const TICK_OFFSET = -9;
const KNOB_SIZE = 52;
const STOP_COUNT = 5;
const KNOB_OPACITY = 0.85;
const LAST_STOP = STOP_COUNT - 1;

const snapEasing = Easing.bezier(0.45, 0, 0.55, 1);

function clampStop(value: number) {
  return Math.max(0, Math.min(LAST_STOP, value));
}

function knobLeftFor(index: number, trackWidth: number) {
  return (index / LAST_STOP) * trackWidth;
}

export function BudRangePicker({
  index,
  onIndexChange,
  progress,
  style,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  progress?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useV3Colors();
  const { width: windowWidth } = useWindowDimensions();
  const trackWidth = Math.min(TRACK_WIDTH, Math.max(160, windowWidth - KNOB_SIZE - 24));
  const step = trackWidth / LAST_STOP;
  const indexRef = useRef(index);
  indexRef.current = index;
  const dragging = useRef(false);
  const skipSnap = useRef(true);
  const knobX = useSharedValue(knobLeftFor(index, trackWidth));

  const snapTo = useCallback(
    (next: number, animated: boolean) => {
      const left = knobLeftFor(next, trackWidth);
      if (animated) {
        knobX.value = withTiming(left, {
          duration: motion.moodMs,
          easing: snapEasing,
        });
        if (progress) {
          progress.value = withTiming(next, {
            duration: motion.moodMs,
            easing: snapEasing,
          });
        }
        return;
      }
      knobX.value = left;
      if (progress) progress.value = next;
    },
    [knobX, progress, trackWidth],
  );

  useEffect(() => {
    if (dragging.current) return;
    if (skipSnap.current) {
      skipSnap.current = false;
      snapTo(index, false);
      return;
    }
    snapTo(index, true);
  }, [index, snapTo]);

  const setFromX = useCallback(
    (locationX: number) => {
      const x = Math.max(0, Math.min(trackWidth, locationX - KNOB_SIZE / 2));
      const nextProgress = (x / trackWidth) * LAST_STOP;
      knobX.value = x;
      if (progress) progress.value = nextProgress;
      const next = clampStop(Math.round(nextProgress));
      if (next !== indexRef.current) {
        onIndexChange(next);
      }
    },
    [knobX, onIndexChange, progress, trackWidth],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dragging.current = true;
          setFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          setFromX(event.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          dragging.current = false;
          snapTo(indexRef.current, true);
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          snapTo(indexRef.current, true);
        },
      }),
    [setFromX, snapTo],
  );

  const knobStyle = useAnimatedStyle(() => ({
    left: knobX.value,
  }));

  const nudge = (direction: 1 | -1) => {
    onIndexChange(clampStop(indexRef.current + direction));
  };

  const trackLeft = KNOB_SIZE / 2;
  const trackTop = (KNOB_SIZE - TRACK_HEIGHT) / 2;

  return (
    <View
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel="Como você tem se sentido"
      accessibilityValue={{ min: 0, max: LAST_STOP, now: index }}
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === 'increment') nudge(1);
        if (event.nativeEvent.actionName === 'decrement') nudge(-1);
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      style={[
        {
          width: trackWidth + KNOB_SIZE,
          height: KNOB_SIZE,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: trackLeft,
          top: trackTop,
          height: TRACK_HEIGHT,
          width: trackWidth,
          backgroundColor: colors.text,
        }}
      />
      {Array.from({ length: STOP_COUNT }, (_, tick) => (
        <View
          key={tick}
          style={{
            position: 'absolute',
            width: TICK_WIDTH,
            height: TICK_HEIGHT,
            left: trackLeft + tick * step,
            top: trackTop + TICK_OFFSET,
            backgroundColor: colors.text,
          }}
        />
      ))}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: KNOB_SIZE / 2,
            backgroundColor: colors.accent,
            opacity: KNOB_OPACITY,
            top: 0,
          },
          knobStyle,
        ]}
      />
    </View>
  );
}
