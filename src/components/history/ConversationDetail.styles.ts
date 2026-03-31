import { StyleSheet } from 'react-native';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';

export function useConversationDetailStyles() {
  const onboardingColors = useOnboardingColors();

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: onboardingColors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontFamily: frauncesFont,
      color: onboardingColors.textSecondary,
    },
    headerRow: {
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1,
      borderColor: 'rgba(95, 99, 104, 0.35)',
    },
    titleBlock: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      fontFamily: frauncesFont,
      fontSize: 30,
      color: onboardingColors.white,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: frauncesFont,
      fontSize: 16,
      color: onboardingColors.textSecondary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    emptyState: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontFamily: frauncesFont,
      color: onboardingColors.textSecondary,
      textAlign: 'center',
    },
    messages: {
      gap: 14,
    },
    messageRow: {
      width: '100%',
      paddingVertical: 6,
    },
    contextCard: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
    },
    contextBadge: {
      fontFamily: frauncesFont,
      fontSize: 12,
      color: onboardingColors.textTaupe,
      marginBottom: 6,
      opacity: 0.9,
    },
    contextTitle: {
      fontFamily: frauncesFont,
      fontSize: 16,
      color: onboardingColors.white,
      marginBottom: 4,
    },
    contextDescription: {
      fontFamily: frauncesFont,
      fontSize: 14,
      color: onboardingColors.textSecondary,
      lineHeight: 20,
    },
    contextFallbackWrap: {
      justifyContent: 'center',
    },
    contextFallbackCard: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
    },
    contextFallbackText: {
      fontFamily: frauncesFont,
      fontSize: 14,
      color: onboardingColors.textSecondary,
      textAlign: 'center',
    },
  });
}

