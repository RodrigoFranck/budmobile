import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import type { InsightCardPalette } from '@/constants/insightCategoryTheme';

export function createInsightContextCardStyles(palette: InsightCardPalette) {
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
      width: '100%',
    },
    card: {
      width: '100%',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 22,
      paddingBottom: 26,
      alignItems: 'center',
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.badgeBg,
      marginBottom: 16,
    },
    badgeText: {
      fontFamily: instrumentSansFont,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: palette.badgeText,
      textAlign: 'center',
    },
    title: {
      fontFamily: frauncesFont,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: '400',
      color: palette.title,
      textAlign: 'center',
    },
    body: {
      fontFamily: frauncesFont,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '400',
      color: palette.title,
      textAlign: 'center',
    },
  });
}
