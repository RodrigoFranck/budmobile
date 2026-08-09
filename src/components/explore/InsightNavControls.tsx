import type { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  insightCardActionLayout,
  insightNavControlsStyles,
} from '@/components/explore/InsightCard.styles';
import { EXPLORE_INSIGHT_COUNT } from '@/constants/exploreInsights';

interface InsightNavControlsProps {
  progress: SharedValue<number>;
  onPrev: () => void;
  onNext: () => void;
  centerSlot?: ReactNode;
}

export function InsightNavControls({
  progress,
  onPrev,
  onNext,
  centerSlot,
}: InsightNavControlsProps) {
  const iconSize = Math.round(insightCardActionLayout.height * 0.55);
  const lastIndex = EXPLORE_INSIGHT_COUNT - 1;

  const prevStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.15],
      [0.28, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const nextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [lastIndex - 0.15, lastIndex],
      [1, 0.28],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <View style={insightNavControlsStyles.wrap}>
      <Animated.View style={prevStyle}>
        <TouchableOpacity
          onPress={onPrev}
          accessibilityRole="button"
          accessibilityLabel="Ir para o insight anterior"
          activeOpacity={0.7}
          style={insightNavControlsStyles.button}
          hitSlop={insightCardActionLayout.voiceHitSlop}
        >
          <ChevronLeft size={iconSize} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      <View style={insightNavControlsStyles.center}>{centerSlot}</View>

      <Animated.View style={nextStyle}>
        <TouchableOpacity
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Ir para o próximo insight"
          activeOpacity={0.7}
          style={insightNavControlsStyles.button}
          hitSlop={insightCardActionLayout.voiceHitSlop}
        >
          <ChevronRight size={iconSize} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
