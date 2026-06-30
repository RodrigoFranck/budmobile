import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Mic } from 'lucide-react-native';

import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';

const BAR_SCALES = [0.42, 0.72, 1, 0.55, 0.85];

function getHeroLayout(width: number, height: number) {
  const micSize = Math.round(Math.min(width * 0.22, height * 0.11, 96));
  const barHeight = Math.round(Math.max(24, micSize * 0.36));
  const barWidth = Math.max(3, Math.round(width * 0.01));
  const barGap = Math.max(4, Math.round(width * 0.012));
  const iconSize = Math.round(micSize * 0.41);
  const waveformGap = Math.round(height * 0.022);
  const captionGap = Math.round(height * 0.018);
  const captionSize = Math.max(12, Math.round(width * 0.034));
  const marginTop = Math.round(height * 0.015);
  const marginBottom = Math.round(height * 0.04);

  return {
    micSize,
    barHeight,
    barWidth,
    barGap,
    iconSize,
    waveformGap,
    captionGap,
    captionSize,
    marginTop,
    marginBottom,
  };
}

export function VoiceOnboardingHero() {
  const { width, height } = useWindowDimensions();
  const layout = useMemo(() => getHeroLayout(width, height), [width, height]);
  const onboardingColors = useOnboardingColors();
  const bars = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const barsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bars, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bars, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    barsLoop.start();
    return () => barsLoop.stop();
  }, [bars]);

  return (
    <View
      style={[
        styles.wrapper,
        { marginTop: layout.marginTop, marginBottom: layout.marginBottom },
      ]}
    >
      <View
        style={[
          styles.micButton,
          {
            width: layout.micSize,
            height: layout.micSize,
            borderRadius: layout.micSize / 2,
            backgroundColor: onboardingColors.accent,
            shadowColor: onboardingColors.accent,
            marginBottom: layout.waveformGap,
          },
        ]}
      >
        <Mic
          size={layout.iconSize}
          color={onboardingColors.textOnAccent}
          strokeWidth={2}
        />
      </View>

      <View
        style={[
          styles.waveform,
          {
            gap: layout.barGap,
            height: layout.barHeight,
            marginBottom: layout.captionGap,
          },
        ]}
      >
        {BAR_SCALES.map((base, index) => {
          const scaleY = bars.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35 + base * 0.25, 0.55 + base * 0.45],
          });

          return (
            <Animated.View
              key={index}
              style={{
                width: layout.barWidth,
                height: layout.barHeight,
                borderRadius: layout.barWidth / 2,
                backgroundColor: onboardingColors.white,
                transform: [
                  { translateY: layout.barHeight / 2 },
                  { scaleY },
                  { translateY: -layout.barHeight / 2 },
                ],
              }}
            />
          );
        })}
      </View>

      <Text
        style={[
          styles.caption,
          {
            color: onboardingColors.textOnGradientMuted,
            fontSize: layout.captionSize,
          },
        ]}
      >
        Sua voz, sua conversa
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: frauncesFont,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
