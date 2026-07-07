import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useAppColors } from '@/lib/colors';
import { createTypingIndicatorStyles } from '@/components/chat/TypingIndicator.styles';

function AnimatedDot({ anim, style }: { anim: Animated.Value; style: object }) {
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.85],
  });

  return (
    <Animated.View
      style={[style, { transform: [{ translateY }], opacity }]}
    />
  );
}

export function TypingIndicator() {
  const colors = useAppColors();
  const styles = useMemo(
    () => createTypingIndicatorStyles({ colors }),
    [colors],
  );

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 340,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 340,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, 680 - delay)),
        ]),
      );

    const loops = [
      createLoop(dot1, 0),
      createLoop(dot2, 170),
      createLoop(dot3, 340),
    ];

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [dot1, dot2, dot3]);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Bud está digitando"
      accessibilityRole="text"
    >
      <AnimatedDot anim={dot1} style={styles.dot} />
      <AnimatedDot anim={dot2} style={styles.dot} />
      <AnimatedDot anim={dot3} style={styles.dot} />
    </View>
  );
}
