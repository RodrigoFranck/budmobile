import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import type { AppColors } from '@/lib/colors';

const MIN_SIZE = 48;

function getProminentGradientStops(
  colors: AppColors,
  mode: 'light' | 'dark',
): {
  base: [string, string, string];
  sheen: [string, string, string];
  iconColor: string;
  shadowColor: string;
} {
  if (mode === 'dark') {
    return {
      base: ['#2A3F3F', '#3D5555', colors['chat-gradient-end']],
      sheen: ['rgba(255,255,255,0)', 'rgba(190,238,238,0.22)', 'rgba(255,255,255,0)'],
      iconColor: colors['chat-accent-mint'],
      shadowColor: '#1A2828',
    };
  }

  return {
    base: ['#1A5754', colors['chat-accent-mint'], '#4ECDC8'],
    sheen: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0.05)'],
    iconColor: '#FFFFFF',
    shadowColor: '#2E7D7A',
  };
}

interface ProminentVoiceButtonProps {
  colors: AppColors;
  size: number;
  isConnected: boolean;
  isLoading: boolean;
  onPress: () => void;
  disabled: boolean;
}

export function ProminentVoiceButton({
  colors,
  size,
  isConnected,
  isLoading,
  onPress,
  disabled,
}: ProminentVoiceButtonProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const breathe = useRef(new Animated.Value(0)).current;
  const buttonSize = Math.max(size, MIN_SIZE);
  const radius = buttonSize / 2;
  const iconSize = Math.round(buttonSize * 0.4);
  const gradientStops = useMemo(
    () => getProminentGradientStops(colors, mode),
    [colors, mode],
  );
  const showSheen = !isConnected && !isLoading;

  useEffect(() => {
    if (!showSheen) {
      breathe.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: isDark ? 1800 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: isDark ? 1800 : 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [breathe, isDark, showSheen]);

  const sheenOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.15, 0.65] : [0.35, 1],
  });

  const buttonScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [1, 1.04] : [1, 1.06],
  });

  if (isConnected) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Encerrar voz"
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: radius,
            backgroundColor: 'rgba(239, 68, 68, 0.16)',
            borderWidth: 1.5,
            borderColor: colors.destructive,
          },
        ]}
      >
        <MicOff size={iconSize} color={colors.destructive} />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        isDark ? styles.buttonShadowDark : styles.buttonShadowLight,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: radius,
          shadowColor: gradientStops.shadowColor,
          transform: [{ scale: showSheen ? buttonScale : 1 }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Iniciar conversa por voz"
        style={[
          { width: buttonSize, height: buttonSize, borderRadius: radius },
          isDark && styles.darkBorder,
        ]}
      >
        <LinearGradient
          colors={gradientStops.base}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.gradient,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: radius,
            },
          ]}
        >
          {showSheen ? (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { opacity: sheenOpacity }]}
            >
              <LinearGradient
                colors={gradientStops.sheen}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
              />
            </Animated.View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="small" color={gradientStops.iconColor} />
          ) : (
            <Mic size={iconSize} color={gradientStops.iconColor} strokeWidth={2.2} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadowLight: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.42,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  buttonShadowDark: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  darkBorder: {
    borderWidth: 1,
    borderColor: 'rgba(190,238,238,0.18)',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
