import { useMemo } from 'react';

import { useTheme } from '@/contexts/ThemeContext';
import { useAppColors, type AppColors } from '@/lib/colors';

export interface ActivitiesThemeTokens {
  surface: string;
  foreground: string;
  muted: string;
  subtle: string;
  icon: string;
  iconOnImage: string;
  controlBg: string;
  controlBorder: string;
  chipBorder: string;
  chipBg: string;
  chipText: string;
  chipSelectedBg: string;
  chipSelectedText: string;
  chipSubtitleSelected: string;
  progressTrack: string;
  progressFill: string;
  sliderThumb: string;
  ctaBg: string;
  ctaText: string;
  errorText: string;
  placeholder: string;
  questionOnCard: string;
  isDark: boolean;
}

export function getActivitiesThemeTokens(colors: AppColors, isDark: boolean): ActivitiesThemeTokens {
  return {
    surface: colors['chat-warm-bg'],
    foreground: colors.foreground,
    muted: colors['muted-foreground'],
    subtle: isDark ? '#A69E99' : colors['muted-foreground'],
    icon: colors['muted-foreground'],
    iconOnImage: 'rgba(255,255,255,0.7)',
    controlBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(29,25,22,0.08)',
    controlBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(29,25,22,0.12)',
    chipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(29,25,22,0.12)',
    chipBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(29,25,22,0.05)',
    chipText: isDark ? 'rgba(255,255,255,0.8)' : colors.foreground,
    chipSelectedBg: isDark ? '#FFFFFF' : colors.foreground,
    chipSelectedText: isDark ? colors['chat-warm-bg'] : colors.background,
    chipSubtitleSelected: isDark ? 'rgba(29,25,22,0.6)' : 'rgba(247,241,237,0.75)',
    progressTrack: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(29,25,22,0.12)',
    progressFill: isDark ? 'rgba(255,255,255,0.7)' : colors.foreground,
    sliderThumb: isDark ? '#FFFFFF' : colors.foreground,
    ctaBg: isDark ? '#FFFFFF' : colors.foreground,
    ctaText: isDark ? colors['chat-warm-bg'] : colors.background,
    errorText: isDark ? '#A69E99' : colors['muted-foreground'],
    placeholder: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(29,25,22,0.35)',
    questionOnCard: '#FFFFFF',
    isDark,
  };
}

export function useActivitiesTheme(): ActivitiesThemeTokens {
  const colors = useAppColors();
  const { isDarkMode } = useTheme();
  return useMemo(() => getActivitiesThemeTokens(colors, isDarkMode), [colors, isDarkMode]);
}

export function resolveCheckInGradient(
  gradient: readonly [string, string, string],
  surface: string,
): [string, string, string] {
  return [gradient[0], gradient[1], surface];
}
