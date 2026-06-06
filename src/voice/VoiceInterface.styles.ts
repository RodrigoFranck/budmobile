import { type ViewStyle } from 'react-native';

import type { AppColors } from '@/lib/colors';

export type VoiceAppearance = 'default' | 'companion' | 'prominent';

export function getVoiceButtonDimensions(
  appearance: VoiceAppearance,
  prominentSize?: number,
): {
  width: number;
  height: number;
  iconSize: number;
} {
  if (appearance === 'prominent') {
    const size = prominentSize ?? 52;
    return {
      width: size,
      height: size,
      iconSize: Math.max(20, Math.round(size * 0.44)),
    };
  }
  if (appearance === 'companion') {
    return { width: 40, height: 52, iconSize: 22 };
  }
  return { width: 40, height: 40, iconSize: 22 };
}

export function getVoiceButtonStyles(
  colors: AppColors,
  appearance: VoiceAppearance,
  isConnected: boolean,
): {
  button: ViewStyle;
  iconColor: string;
} {
  const { width, height } = getVoiceButtonDimensions(appearance);

  if (appearance === 'prominent') {
    return {
      button: {
        width,
        height,
        borderRadius: width / 2,
        alignItems: 'center',
        justifyContent: 'center',
      },
      iconColor: isConnected ? colors.destructive : colors['accent-foreground'],
    };
  }

  return {
    button: {
      width,
      height,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconColor: isConnected
      ? colors.destructive
      : appearance === 'companion'
        ? colors['chat-body']
        : colors['foreground-muted'],
  };
}
