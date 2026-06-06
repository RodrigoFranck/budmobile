import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import { LayoutSpacing } from '@/constants/layout';
import type { ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export function createActivitiesHomeStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    scrollContent: {
      paddingBottom: LayoutSpacing.contentPadding.bottom + 16,
    },
    bodyContent: {
      paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
    },
    title: {
      fontFamily: frauncesFont,
      fontSize: 28,
      color: t.foreground,
      marginTop: 24,
    },
    subtitle: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: t.muted,
      marginTop: 8,
      lineHeight: 22,
    },
    checkInCard: {
      marginTop: 32,
      height: 220,
      borderRadius: 16,
      overflow: 'hidden',
    },
    checkInCardImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    checkInCardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    checkInCardContent: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 20,
    },
    checkInTitle: {
      fontFamily: frauncesFont,
      fontSize: 22,
      color: 'rgba(255,255,255,0.95)',
    },
    checkInSubtitle: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: 'rgba(255,255,255,0.65)',
      marginTop: 4,
    },
  });
}
