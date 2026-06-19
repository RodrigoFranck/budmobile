import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useAppColors } from '@/lib/colors';
import { createTypingIndicatorStyles } from '@/components/chat/TypingIndicator.styles';

const DOT_COUNT = 3;
const WAVE_DURATION = 280;
const WAVE_STAGGER = 140;

function TypingDot({
  index,
  dotStyle,
}: {
  index: number;
  dotStyle: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * WAVE_STAGGER),
        Animated.timing(anim, {
          toValue: 1,
          duration: WAVE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: WAVE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay((DOT_COUNT - 1 - index) * WAVE_STAGGER),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <Animated.View
      style={[dotStyle, { opacity, transform: [{ translateY }] }]}
    />
  );
}

export function TypingIndicator() {
  const colors = useAppColors();
  const styles = useMemo(
    () => createTypingIndicatorStyles({ colors }),
    [colors],
  );

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel="Bud está digitando"
    >
      <View style={styles.badge}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <TypingDot key={index} index={index} dotStyle={styles.dot} />
        ))}
      </View>
    </View>
  );
}
