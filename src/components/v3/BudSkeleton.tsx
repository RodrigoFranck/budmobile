import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion, useV3Colors, type V3Colors } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

type BoneTone = 'surface' | 'line';

type BudSkeletonBoneProps = {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  tone?: BoneTone;
  style?: StyleProp<ViewStyle>;
  colors?: V3Colors;
};

type BudSkeletonPulseProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type BudContentRevealProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function boneColor(colors: V3Colors, tone: BoneTone, mode: 'light' | 'dark') {
  if (tone === 'line') {
    return mode === 'light' ? colors.bg : colors.surface2;
  }
  return colors.surface;
}

export function BudSkeletonBone({
  width,
  height,
  borderRadius = 8,
  tone = 'surface',
  style,
  colors: colorsProp,
}: BudSkeletonBoneProps) {
  const themeColors = useV3Colors();
  const colors = colorsProp ?? themeColors;
  const { mode } = useTheme();

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: boneColor(colors, tone, mode),
        },
        style,
      ]}
    />
  );
}

export function BudSkeletonPulse({
  children,
  style,
  accessibilityLabel = 'Carregando conteúdo',
}: BudSkeletonPulseProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = 1;
    opacity.value = withRepeat(
      withTiming(0.55, {
        duration: motion.skeletonPulseMs / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}

export function BudContentReveal({ children, style }: BudContentRevealProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: reduceMotion ? 0 : motion.contentRevealMs,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
