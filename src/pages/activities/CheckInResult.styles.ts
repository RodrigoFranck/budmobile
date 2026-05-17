import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import type { ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export function createCheckInResultStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 12,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBadge: {
      flex: 1,
      fontFamily: instrumentSansFont,
      fontSize: 11,
      letterSpacing: 2.2,
      color: t.muted,
      textTransform: 'uppercase',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    loadingContainer: {
      minHeight: 360,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 48,
    },
    loadingMessage: {
      fontFamily: frauncesFont,
      fontSize: 26,
      lineHeight: 36,
      color: t.foreground,
      opacity: 0.85,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    headline: {
      fontFamily: frauncesFont,
      fontSize: 32,
      lineHeight: 40,
      color: t.foreground,
      marginTop: 8,
    },
    analysisParagraph: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      lineHeight: 24,
      color: t.foreground,
      opacity: 0.85,
      marginTop: 16,
    },
    reflectTitle: {
      fontFamily: instrumentSansFont,
      fontSize: 11,
      letterSpacing: 2.2,
      color: t.muted,
      textTransform: 'uppercase',
      marginTop: 28,
      marginBottom: 12,
    },
    questionCard: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.controlBorder,
      backgroundColor: t.chipBg,
      marginBottom: 10,
    },
    questionText: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      lineHeight: 20,
      color: t.foreground,
      opacity: 0.85,
    },
    ctaButton: {
      height: 48,
      borderRadius: 24,
      backgroundColor: t.ctaBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    ctaLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: t.ctaText,
    },
    errorText: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      lineHeight: 22,
      color: t.errorText,
      textAlign: 'center',
      marginTop: 24,
    },
    errorButton: {
      marginTop: 20,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: t.controlBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    errorButtonLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: t.foreground,
    },
  });
}
