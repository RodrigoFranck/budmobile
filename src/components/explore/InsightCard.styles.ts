import { StyleSheet } from 'react-native';
import { onboardingColors, frauncesFont } from '@/constants/onboardingTheme';

export const insightCardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: onboardingColors.backgroundAlt,
    borderColor: onboardingColors.accent,
    borderWidth: 1,
  },
  loadingContainer: {
    backgroundColor: onboardingColors.backgroundAlt,
    borderColor: 'rgba(95, 99, 104, 0.35)',
    borderWidth: 1,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  badgeText: {
    fontFamily: frauncesFont,
    color: onboardingColors.grayMedium,
  },
  titleText: {
    fontFamily: frauncesFont,
  },
  descriptionText: {
    color: onboardingColors.textTaupe,
  },
  contentContainer: {
    paddingBottom: 56,
  },
  contentGap: {
    gap: 12,
  },
  secondaryButtonWrap: {
    marginTop: 16,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
  },
  secondaryButtonLocked: {
    opacity: 0.5,
  },
  secondaryButtonEnabled: {
    opacity: 1,
  },
  secondaryButtonText: {
    fontFamily: frauncesFont,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  actionButton: {
    position: 'absolute',
    left: 16,
    right: 72,
    bottom: 18,
    height: 46,
    borderRadius: 69,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  actionButtonLocked: {
    opacity: 0.55,
  },
  actionButtonEnabled: {
    opacity: 1,
  },
  actionButtonText: {
    fontFamily: frauncesFont,
    fontSize: 15,
    color: '#EFEAE6',
  },
  micButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonEnabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(95, 99, 104, 0.55)',
    opacity: 1,
  },
  micButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.55,
  },
});

export const insightCardImageStyle = { opacity: 0.6 } as const;
export const insightCardMicHitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

