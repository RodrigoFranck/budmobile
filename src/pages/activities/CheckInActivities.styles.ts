import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import { LayoutSpacing } from '@/constants/layout';
import type { ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export function createCheckInActivitiesStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: LayoutSpacing.contentPadding.bottom + 24,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: frauncesFont,
      fontSize: 28,
      color: t.foreground,
      marginTop: 16,
    },
    subtitle: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: t.muted,
      marginTop: 6,
    },
    card: {
      height: 200,
      borderRadius: 20,
      overflow: 'hidden',
      marginTop: 20,
    },
    cardImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    cardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    cardBody: {
      flex: 1,
      padding: 16,
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontFamily: instrumentSansFont,
      fontSize: 18,
      color: t.questionOnCard,
    },
    cardPrompt: {
      fontFamily: instrumentSansFont,
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    cardCta: {
      fontFamily: instrumentSansFont,
      fontSize: 13,
      color: 'rgba(255,255,255,0.9)',
    },
    cardLocked: {
      opacity: 0.72,
    },
    cardOverlayLocked: {
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
  });
}
