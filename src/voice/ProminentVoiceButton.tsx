import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MicOff } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import type { AppColors } from '@/lib/colors';
import { WavesIcon } from '@/voice/WavesIcon';

const MIN_HEIGHT = 48;

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
  const height = Math.max(size, MIN_HEIGHT);
  const iconSize = Math.round(height * 0.42);
  const showIdlePulse = !isConnected && !isLoading;

  const palette = useMemo(() => {
    if (isDark) {
      return {
        circleBg: '#FFFFFF',
        waveColor: '#373737',
        connectedBg: 'rgba(239, 68, 68, 0.16)',
        connectedBorder: colors.destructive,
      };
    }
    return {
      circleBg: '#FFFFFF',
      waveColor: '#373737',
      connectedBg: 'rgba(239, 68, 68, 0.16)',
      connectedBorder: colors.destructive,
    };
  }, [colors, isDark]);

  useEffect(() => {
    if (!showIdlePulse) {
      breathe.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [breathe, showIdlePulse]);

  const waveScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
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
          styles.connectedButton,
          {
            width: height,
            height,
            borderRadius: height / 2,
            backgroundColor: palette.connectedBg,
            borderColor: palette.connectedBorder,
          },
        ]}
      >
        <MicOff size={iconSize} color={colors.destructive} />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: showIdlePulse ? waveScale : 1 }] }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Iniciar conversa por voz"
        style={[
          styles.waveCircle,
          {
            width: height,
            height,
            borderRadius: height / 2,
            backgroundColor: palette.circleBg,
          },
          isDark ? styles.shadowDark : styles.shadowLight,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.waveColor} />
        ) : (
          <WavesIcon size={iconSize} color={palette.waveColor} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
  },
  shadowDark: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
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
  waveCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
