import { StyleSheet } from 'react-native';
import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import { darkColors } from '@/lib/colors';

export const insightCardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(33, 33, 33, 0.85)',
    borderRadius: 20,
    minHeight: 340,
    overflow: 'hidden',
  },
  loadingContainer: {
    backgroundColor: 'rgba(33, 33, 33, 0.85)',
    borderRadius: 20,
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 19,
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  contentContainerNoActions: {
    paddingBottom: 28,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 17,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    minHeight: 32,
    minWidth: 180,
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
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  contentGap: {
    gap: 20,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: frauncesFont,
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: instrumentSansFont,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  progressWrap: {
    marginTop: 4,
    gap: 8,
    width: '100%',
  },
  progressLabel: {
    fontFamily: instrumentSansFont,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionsRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 69,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  actionButtonLocked: {
    opacity: 0.55,
  },
  actionButtonEnabled: {
    opacity: 1,
  },
  actionButtonText: {
    fontFamily: instrumentSansFont,
    fontSize: 15,
    color: 'rgba(240, 235, 229, 0.6)',
    flexShrink: 1,
  },
  sendIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#EFEAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonEnabled: {
    backgroundColor: darkColors['chat-mic-peach'],
    opacity: 1,
  },
  micButtonDisabled: {
    backgroundColor: 'rgba(190, 169, 156, 0.35)',
    opacity: 0.55,
  },
});

export const insightCardImageStyle = { opacity: 0.6, borderRadius: 20 } as const;
export const insightCardMicHitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
