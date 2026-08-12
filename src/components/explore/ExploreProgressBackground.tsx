import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  EXPLORE_INSIGHT_KEYS,
  ExploreInsightGradients,
} from '@/constants/exploreInsights';
import { useTheme } from '@/contexts/ThemeContext';

interface ExploreProgressBackgroundProps {
  progress: SharedValue<number>;
}

function GradientLayer({
  index,
  progress,
  colors,
}: {
  index: number;
  progress: SharedValue<number>;
  colors: readonly [string, string, string];
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    return { opacity };
  }, [index]);

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, animatedStyle]}>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function ExploreProgressBackground({
  progress,
}: ExploreProgressBackgroundProps) {
  const { mode } = useTheme();

  return (
    <View pointerEvents="none" style={styles.root}>
      <View
        style={[
          styles.layer,
          { backgroundColor: mode === 'dark' ? '#1D1916' : '#F7F1ED' },
        ]}
      />
      {EXPLORE_INSIGHT_KEYS.map((key, index) => (
        <GradientLayer
          key={key}
          index={index}
          progress={progress}
          colors={ExploreInsightGradients[key].screen[mode].base}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
