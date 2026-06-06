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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingRight: 12,
    },
    backLabel: {
      fontFamily: frauncesFont,
      fontSize: 16,
      color: onboardingColors.textTaupe,
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
      gap: 20,
    },
    messageRow: {
      width: '100%',
      paddingVertical: 8,
    },
    userWrap: {
      alignItems: 'flex-end',
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    userBubble: {
      maxWidth: '78%',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    userBody: {
      fontFamily: frauncesFont,
      fontSize: 15,
      color: onboardingColors.white,
      lineHeight: 22,
    },
    assistantWrap: {
      alignItems: 'flex-start',
      maxWidth: '88%',
    },
    assistantMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    roleLabel: {
      fontFamily: frauncesFont,
      fontSize: 12,
      color: onboardingColors.textTaupe,
    },
    timeLabel: {
      fontFamily: frauncesFont,
      fontSize: 12,
      color: onboardingColors.textSecondary,
      opacity: 0.7,
    },
    assistantBody: {
      fontFamily: frauncesFont,
      fontSize: 15,
      color: onboardingColors.white,
      lineHeight: 22,
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

