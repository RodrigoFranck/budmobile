/**
 * Design tokens — onboarding (Figma / Bud)
 */
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const darkOnboardingColors = {
  background: '#171310',
  backgroundAlt: '#201B18',
  card: '#2A2522',
  inputSurface: '#2A2522',
  optionBg: '#2A2522',
  white: '#F1E6DB',
  pureWhite: '#F1E6DA',
  textSecondary: '#A39C93',
  textMuted: '#7A726A',
  textTaupe: '#7A726A',
  grayMedium: '#7A726A',
  textOnGradient: 'rgba(241, 230, 219, 0.88)',
  textOnGradientMuted: 'rgba(241, 230, 219, 0.72)',
  gradientIconSurface: 'rgba(241, 230, 219, 0.14)',
  accent: '#B0EDEE',
  accentAlt: '#B0EDEE',
  textOnAccent: '#171311',
  borderDark: '#3A332D',
  linearTop: '#171310',
  linearMid: '#201B18',
  linearBottom: '#2A2522',
} as const;

export const lightOnboardingColors = {
  background: '#F1E6DB',
  backgroundAlt: '#E5D8CA',
  card: '#E5D8CA',
  inputSurface: '#E5D8CA',
  optionBg: '#DCCDBD',
  white: '#35302B',
  pureWhite: '#F1E6DB',
  textSecondary: '#6E655C',
  textMuted: '#90877F',
  textTaupe: '#90877F',
  grayMedium: '#90877F',
  textOnGradient: 'rgba(53, 48, 43, 0.82)',
  textOnGradientMuted: 'rgba(53, 48, 43, 0.65)',
  gradientIconSurface: 'rgba(53, 48, 43, 0.08)',
  accent: '#2E7F7C',
  accentAlt: '#2E7F7C',
  textOnAccent: '#F1E6DB',
  borderDark: '#D3C3B2',
  linearTop: '#F1E6DB',
  linearMid: '#E5D8CA',
  linearBottom: '#DCCDBD',
} as const;

export function useOnboardingColors() {
  const { mode } = useTheme();
  return useMemo(() => (mode === 'dark' ? darkOnboardingColors : lightOnboardingColors), [mode]);
}

// Back-compat
export const onboardingColors = darkOnboardingColors;

export const frauncesFont = 'Fraunces_400Regular' as const;
export const instrumentSansFont = 'DMSans_400Regular' as const;
export const dmSansFont = 'DMSans_400Regular' as const;
export const dmSansSemiFont = 'DMSans_600SemiBold' as const;
