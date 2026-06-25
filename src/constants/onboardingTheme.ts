/**
 * Design tokens — onboarding (Figma / Bud)
 */
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const darkOnboardingColors = {
  background: '#1C1917',
  backgroundAlt: '#1A1816',
  card: '#363636',
  inputSurface: '#33312E',
  optionBg: '#333333',
  white: '#FFFFFF',
  pureWhite: '#FFFFFF',
  textSecondary: '#9E9E9E',
  textMuted: '#757575',
  textTaupe: '#77716C',
  grayMedium: '#5F6368',
  textOnGradient: 'rgba(255, 255, 255, 0.88)',
  textOnGradientMuted: 'rgba(255, 255, 255, 0.72)',
  gradientIconSurface: 'rgba(255, 255, 255, 0.14)',
  accent: '#BBEEEE',
  accentAlt: '#C5F1F1',
  textOnAccent: '#1C1917',
  borderDark: '#4A5568',
  linearTop: '#1A1A1A',
  linearMid: '#243838',
  linearBottom: '#3D6B6B',
} as const;

export const lightOnboardingColors = {
  background: '#F7F1ED',
  backgroundAlt: '#FFFFFF',
  card: '#FFFFFF',
  inputSurface: '#FFFFFF',
  optionBg: '#FFFFFF',
  white: '#1D1916',
  pureWhite: '#FFFFFF',
  textSecondary: 'rgba(29,25,22,0.70)',
  textMuted: 'rgba(29,25,22,0.55)',
  textTaupe: 'rgba(29,25,22,0.55)',
  grayMedium: 'rgba(29,25,22,0.45)',
  textOnGradient: 'rgba(29, 25, 22, 0.82)',
  textOnGradientMuted: 'rgba(29, 25, 22, 0.65)',
  gradientIconSurface: 'rgba(29, 25, 22, 0.08)',
  accent: '#2E7D7A',
  accentAlt: '#2E7D7A',
  textOnAccent: '#FFFFFF',
  borderDark: 'rgba(29,25,22,0.12)',
  linearTop: '#F7F1ED',
  linearMid: '#E8F2F2',
  linearBottom: '#C5E0E0',
} as const;

export function useOnboardingColors() {
  const { mode } = useTheme();
  return useMemo(() => (mode === 'dark' ? darkOnboardingColors : lightOnboardingColors), [mode]);
}

// Back-compat
export const onboardingColors = darkOnboardingColors;

export const frauncesFont = 'Fraunces_400Regular' as const;
export const instrumentSansFont = 'InstrumentSans' as const;
