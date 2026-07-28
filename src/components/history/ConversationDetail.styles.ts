import { StyleSheet } from 'react-native';
import {
  frauncesFont,
  instrumentSansFont,
  useOnboardingColors,
} from '@/constants/onboardingTheme';

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
      fontFamily: instrumentSansFont,
      color: onboardingColors.textSecondary,
    },
    headerRow: {
      paddingHorizontal: 20,
      paddingBottom: 14,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    titleBlock: {
      paddingTop: 24,
      paddingBottom: 28,
    },
    weekday: {
      fontFamily: frauncesFont,
      fontSize: 24,
      color: onboardingColors.white,
      marginBottom: 4,
    },
    dateLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 19,
      color: onboardingColors.white,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 30,
      paddingBottom: 40,
    },
    emptyState: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontFamily: instrumentSansFont,
      color: onboardingColors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    messages: {
      gap: 28,
    },
    messageRow: {
      width: '100%',
    },
    userWrap: {
      alignItems: 'flex-end',
    },
    assistantWrap: {
      alignItems: 'flex-start',
    },
    roleLabelBud: {
      fontFamily: frauncesFont,
      fontSize: 20,
      fontStyle: 'italic',
      color: onboardingColors.grayMedium,
      marginBottom: 6,
    },
    roleLabelUser: {
      fontFamily: frauncesFont,
      fontSize: 20,
      fontStyle: 'italic',
      color: onboardingColors.grayMedium,
      marginBottom: 6,
    },
    userBody: {
      fontFamily: instrumentSansFont,
      fontSize: 20,
      color: onboardingColors.white,
      lineHeight: 28,
      textAlign: 'right',
      maxWidth: '92%',
    },
    assistantBody: {
      fontFamily: instrumentSansFont,
      fontSize: 20,
      color: onboardingColors.grayMedium,
      lineHeight: 28,
      maxWidth: '92%',
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
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: onboardingColors.textSecondary,
      textAlign: 'center',
    },
  });
}
