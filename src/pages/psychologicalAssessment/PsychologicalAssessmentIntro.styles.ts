import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import type { ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export function createPsychologicalAssessmentIntroStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 24,
    },
    title: {
      fontFamily: frauncesFont,
      fontSize: 32,
      lineHeight: 40,
      color: t.foreground,
    },
    description: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      lineHeight: 24,
      color: t.muted,
      marginTop: 16,
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 20,
    },
    durationText: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: t.muted,
    },
    footer: {
      paddingHorizontal: 30,
      paddingTop: 16,
    },
    primaryButton: {
      height: 52,
      borderRadius: 26,
      backgroundColor: t.ctaBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      fontWeight: '600',
      color: t.ctaText,
    },
  });
}
