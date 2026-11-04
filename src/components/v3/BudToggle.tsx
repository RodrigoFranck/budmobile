import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, useV3Colors } from '@/theme';

const TOGGLE_EASING = Easing.bezier(0.42, 0, 0.58, 1);
const TOGGLE_WIDTH = 52;
const TOGGLE_HEIGHT = 32;
const TOGGLE_THUMB = 26;
const TOGGLE_PAD = 3;
const TOGGLE_TRAVEL = 20;
const STRETCH_PX = 2;

function clamp01(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

export function BudToggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const colors = useV3Colors();
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useSharedValue(value ? 1 : 0);
  const stretch = useSharedValue(0);
  const movingTowardOn = useSharedValue(value ? 1 : 0);
  const dragOrigin = useSharedValue(value ? 1 : 0);
  const dragging = useSharedValue(0);
  const reduceMotionSV = useSharedValue(0);
  const disabledSV = useSharedValue(0);
  const valueSV = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      reduceMotionSV.value = enabled ? 1 : 0;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
      reduceMotionSV.value = enabled ? 1 : 0;
    });
    return () => sub.remove();
  }, [reduceMotionSV]);

  useEffect(() => {
    disabledSV.value = disabled ? 1 : 0;
  }, [disabled, disabledSV]);

  useEffect(() => {
    valueSV.value = value ? 1 : 0;
    if (dragging.value) return;
    movingTowardOn.value = value ? 1 : 0;
    progress.value = withTiming(value ? 1 : 0, {
      duration: reduceMotion ? 120 : motion.toggleMs,
      easing: TOGGLE_EASING,
    });
  }, [dragging, movingTowardOn, progress, reduceMotion, value, valueSV]);

  const finishToggle = (next: boolean) => {
    const duration = reduceMotion ? 120 : motion.toggleMs;
    onValueChange(next);
    setTimeout(() => {
      void Haptics.selectionAsync();
    }, duration);
  };

  const snapTo = (next: boolean) => {
    'worklet';
    movingTowardOn.value = next ? 1 : 0;
    const duration = reduceMotionSV.value ? 120 : motion.toggleMs;
    progress.value = withTiming(next ? 1 : 0, {
      duration,
      easing: TOGGLE_EASING,
    });
    if ((valueSV.value >= 0.5) !== next) {
      runOnJS(finishToggle)(next);
    }
  };

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      if (disabledSV.value) return;
      dragging.value = 1;
      dragOrigin.value = progress.value;
      movingTowardOn.value = progress.value >= 0.5 ? 0 : 1;
      if (!reduceMotionSV.value) {
        stretch.value = withTiming(1, { duration: 120, easing: TOGGLE_EASING });
      }
    })
    .onUpdate((event) => {
      if (disabledSV.value) return;
      if (reduceMotionSV.value) {
        progress.value = event.translationX >= 0 ? 1 : 0;
        return;
      }
      progress.value = clamp01(dragOrigin.value + event.translationX / TOGGLE_TRAVEL);
      movingTowardOn.value = event.translationX >= 0 ? 1 : 0;
    })
    .onFinalize((event) => {
      if (disabledSV.value) {
        dragging.value = 0;
        return;
      }
      stretch.value = withTiming(0, { duration: 120, easing: TOGGLE_EASING });
      dragging.value = 0;
      const tapped = Math.abs(event.translationX) < 4 && Math.abs(event.translationY) < 4;
      if (tapped) {
        snapTo(!(valueSV.value >= 0.5));
        return;
      }
      snapTo(progress.value >= 0.5);
    });

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.line, colors.accent]),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const stretchPx = reduceMotionSV.value
      ? 0
      : interpolate(stretch.value, [0, 1], [0, STRETCH_PX]);
    const baseX = interpolate(progress.value, [0, 1], [TOGGLE_PAD, TOGGLE_PAD + TOGGLE_TRAVEL]);
    const towardOn = movingTowardOn.value >= 0.5;
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [colors.text2, colors.onAccent]),
      width: TOGGLE_THUMB + stretchPx,
      transform: [
        {
          translateX: towardOn ? baseX : baseX - stretchPx,
        },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
        accessibilityLabel={accessibilityLabel}
        style={{ opacity: disabled ? 0.55 : 1 }}
      >
        <Animated.View
          style={[
            {
              width: TOGGLE_WIDTH,
              height: TOGGLE_HEIGHT,
              borderRadius: TOGGLE_HEIGHT / 2,
              justifyContent: 'center',
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                height: TOGGLE_THUMB,
                borderRadius: TOGGLE_THUMB / 2,
                position: 'absolute',
              },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
