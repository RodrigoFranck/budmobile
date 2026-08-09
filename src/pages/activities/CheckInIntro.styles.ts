import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import type { ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export const HERO_HEIGHT = 288;
export const BODY_OVERLAP = 48;

export function createCheckInIntroStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    hero: {
      width: '100%',
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    backButton: {
      position: 'absolute',
      left: 18,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3,
    },
    body: {
      paddingHorizontal: 24,
      marginTop: -BODY_OVERLAP,
    },
    greeting: {
      fontFamily: frauncesFont,
      fontSize: 30,
      lineHeight: 36,
      color: t.foreground,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: t.muted,
    },
    metaDot: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: t.muted,
      opacity: 0.35,
    },
    lead: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      lineHeight: 24,
      color: t.foreground,
      opacity: 0.7,
      marginTop: 12,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontFamily: frauncesFont,
      fontSize: 20,
      lineHeight: 26,
      color: t.foreground,
    },
    sectionBody: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      lineHeight: 24,
      color: t.muted,
      marginTop: 8,
    },
    ctaContainer: {
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    ctaButton: {
      height: 56,
      borderRadius: 16,
      backgroundColor: t.ctaBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      color: t.ctaText,
    },
  });
}
