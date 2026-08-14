import { StyleSheet } from 'react-native';

import { SCREEN } from '@/constants/layout';
import type { InsightCardPalette } from '@/constants/insightCategoryTheme';
import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';

export { insightCardActionLayout } from '@/components/explore/InsightChatActions.styles';

export function createInsightCardStyles(palette: InsightCardPalette) {
  return StyleSheet.create({
    cardContainer: {
      borderRadius: 24,
      minHeight: 340,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
    },
    cardLocked: {
      opacity: 0.75,
    },
    cardFillParent: {
      flex: 1,
    },
    loadingContainer: {
      borderRadius: 24,
      minHeight: 340,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.fillTo,
    },
    gradient: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      paddingTop: 28,
      paddingHorizontal: 28,
      paddingBottom: 80,
    },
    contentContainerNoActions: {
      paddingBottom: 32,
    },
    badgeWrap: {
      alignItems: 'center',
      marginBottom: 12,
    },
    badgeContainer: {
      backgroundColor: palette.badgeBg,
      borderRadius: 999,
      minHeight: 32,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    badgeText: {
      fontFamily: instrumentSansFont,
      fontWeight: '500',
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: palette.badgeText,
      textAlign: 'center',
    },
    contentGap: {
      flex: 1,
      justifyContent: 'center',
      gap: 28,
      alignItems: 'center',
      paddingVertical: 16,
      width: '100%',
    },
    titleText: {
      fontFamily: frauncesFont,
      fontSize: 34,
      lineHeight: 42,
      fontWeight: '400',
      color: palette.title,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    descriptionText: {
      fontFamily: frauncesFont,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '400',
      color: palette.title,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    progressWrap: {
      marginTop: 4,
      gap: 8,
      width: '100%',
    },
    progressLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 13,
      color: palette.muted,
      textAlign: 'center',
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: palette.badgeBg,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: palette.accent,
    },
    secondaryButtonWrap: {
      marginTop: 16,
      alignItems: 'center',
    },
    secondaryButton: {
      alignSelf: 'center',
    },
    secondaryButtonLocked: {
      opacity: 0.5,
    },
    secondaryButtonEnabled: {
      opacity: 1,
    },
    secondaryButtonText: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: palette.muted,
    },
    actionsRow: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
    },
  });
}

export const insightNavControlsStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 10,
    zIndex: 2,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Space reserved for the vertical pagination rail (~6% of screen width). */
export const INSIGHT_PAGINATION_GUTTER = Math.round(SCREEN.width * 0.06);

/** Horizontal inset so the card stays centered with room for the rail (~7%). */
export const INSIGHT_CARD_SIDE_INSET = Math.round(
  SCREEN.width * 0.04 + INSIGHT_PAGINATION_GUTTER / 2,
);

export const insightPaginationStyles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: INSIGHT_PAGINATION_GUTTER,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
});
