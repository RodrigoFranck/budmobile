import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export const TOGGLE_SAVE_FAILED_MESSAGE = 'Não consegui salvar agora. Tente de novo.';

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
  const disabledSV = useSharedValue(disabled ? 1 : 0);
  const valueSV = useSharedValue(value ? 1 : 0);

  const valueRef = useRef(value);
  const disabledRef = useRef(Boolean(disabled));
  const reduceMotionRef = useRef(reduceMotion);
  const onChangeRef = useRef(onValueChange);
  const commitLock = useRef(0);
  valueRef.current = value;
  disabledRef.current = Boolean(disabled);
  reduceMotionRef.current = reduceMotion;
  onChangeRef.current = onValueChange;

  const commit = useCallback((next: boolean) => {
    if (disabledRef.current) return;
    if (next === valueRef.current) return;
    const now = Date.now();
    if (now - commitLock.current < 80) return;
    commitLock.current = now;
    onChangeRef.current(next);
    const duration = reduceMotionRef.current ? 120 : motion.toggleMs;
    setTimeout(() => {
      if (valueRef.current === next) {
        void Haptics.selectionAsync();
      }
    }, duration);
  }, []);

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
    movingTowardOn.value = value ? 1 : 0;
    progress.value = withTiming(value ? 1 : 0, {
      duration: reduceMotion ? 120 : motion.toggleMs,
      easing: TOGGLE_EASING,
    });
  }, [movingTowardOn, progress, reduceMotion, value, valueSV]);

  const gesture = useMemo(() => {
    const settle = (next: boolean) => {
      'worklet';
      const current = valueSV.value >= 0.5;
      movingTowardOn.value = next ? 1 : 0;
      if (current === next) {
        progress.value = withTiming(next ? 1 : 0, {
          duration: reduceMotionSV.value ? 120 : motion.toggleMs,
          easing: TOGGLE_EASING,
        });
        return;
      }
      runOnJS(commit)(next);
    };

    const pan = Gesture.Pan()
      .manualActivation(true)
      .maxPointers(1)
      .hitSlop({ top: 10, bottom: 10, left: 6, right: 6 })
      .onTouchesDown((_event, state) => {
        if (disabledSV.value) {
          state.fail();
          return;
        }
        state.activate();
      })
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
        if (disabledSV.value || !dragging.value) return;
        if (reduceMotionSV.value) {
          progress.value = event.translationX >= 0 ? 1 : 0;
          movingTowardOn.value = event.translationX >= 0 ? 1 : 0;
          return;
        }
        progress.value = clamp01(dragOrigin.value + event.translationX / TOGGLE_TRAVEL);
        movingTowardOn.value = event.translationX >= 0 ? 1 : 0;
      })
      .onFinalize((event, success) => {
        stretch.value = withTiming(0, { duration: 120, easing: TOGGLE_EASING });
        dragging.value = 0;
        if (disabledSV.value || !success) {
          const current = valueSV.value >= 0.5;
          movingTowardOn.value = current ? 1 : 0;
          progress.value = withTiming(current ? 1 : 0, {
            duration: reduceMotionSV.value ? 120 : motion.toggleMs,
            easing: TOGGLE_EASING,
          });
          return;
        }
        const tapped = Math.abs(event.translationX) < 10 && Math.abs(event.translationY) < 10;
        const next = tapped ? valueSV.value < 0.5 : progress.value >= 0.5;
        settle(next);
      });

    const tap = Gesture.Tap()
      .maxDistance(28)
      .maxDuration(2500)
      .hitSlop({ top: 10, bottom: 10, left: 6, right: 6 })
      .onEnd((_event, success) => {
        if (!success || disabledSV.value) return;
        const next = valueSV.value < 0.5;
        movingTowardOn.value = next ? 1 : 0;
        runOnJS(commit)(next);
      });

    return Gesture.Exclusive(pan, tap);
  }, [commit, disabledSV, dragOrigin, dragging, movingTowardOn, progress, reduceMotionSV, stretch, valueSV]);

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
        collapsable={false}
        accessible
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            commit(!value);
          }
        }}
        onAccessibilityTap={() => commit(!value)}
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
