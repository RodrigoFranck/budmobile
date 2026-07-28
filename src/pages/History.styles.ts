import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import type { AppColors } from '@/lib/colors';

export function createHistoryStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    weekNavButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekNavButtonDisabled: {
      opacity: 0.35,
    },
    weekLabel: {
      flex: 1,
      fontFamily: frauncesFont,
      fontSize: 22,
      color: colors.foreground,
      textAlign: 'center',
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginHorizontal: -16,
      marginBottom: 16,
    },
    inspiredCard: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 24,
    },
    inspiredCardProgress: {
      minHeight: 230,
    },
    inspiredCardAvailable: {
      minHeight: 280,
    },
    inspiredImage: {
      width: '100%',
    },
    inspiredImageRadius: {
      borderRadius: 20,
    },
    inspiredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(20, 18, 15, 0.35)',
    },
    inspiredContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      minHeight: 230,
    },
    inspiredContentAvailable: {
      minHeight: 280,
    },
    inspiredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 9,
      marginBottom: 16,
    },
    inspiredBadgeText: {
      fontFamily: instrumentSansFont,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 1.5,
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    inspiredBadgeTextAvailable: {
      color: '#FFFFFF',
    },
    progressRingWrap: {
      marginBottom: 14,
    },
    inspiredProgressMessage: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      maxWidth: 260,
      marginBottom: 12,
    },
    inspiredReleaseText: {
      fontFamily: instrumentSansFont,
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(190,227,219,0.8)',
      textAlign: 'center',
    },
    inspiredTitle: {
      fontFamily: frauncesFont,
      fontSize: 20,
      lineHeight: 28,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 16,
      maxWidth: 330,
    },
    inspiredDescription: {
      fontFamily: instrumentSansFont,
      fontSize: 13,
      lineHeight: 18,
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'center',
      maxWidth: 310,
      marginBottom: 20,
    },
    inspiredCta: {
      width: '100%',
      maxWidth: 290,
      height: 42,
      borderRadius: 69,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inspiredCtaText: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      fontWeight: '500',
      color: '#F0EBE5',
    },
    sectionTitle: {
      fontFamily: frauncesFont,
      fontSize: 22,
      color: colors.foreground,
      marginBottom: 16,
    },
    conversationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 16,
    },
    conversationTextWrap: {
      flex: 1,
      marginRight: 12,
    },
    conversationTitle: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 2,
    },
    conversationDate: {
      fontFamily: instrumentSansFont,
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
    },
    conversationChevron: {
      fontFamily: instrumentSansFont,
      fontSize: 22,
      color: 'rgba(255,255,255,0.3)',
      lineHeight: 28,
    },
    emptyCard: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: instrumentSansFont,
      fontSize: 16,
      color: colors['muted-foreground'],
      textAlign: 'center',
      marginTop: 16,
    },
    emptyWeek: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyWeekText: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: colors['muted-foreground'],
      textAlign: 'center',
    },
  });
}
