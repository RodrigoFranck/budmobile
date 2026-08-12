import { StyleSheet } from 'react-native';
import { SCREEN } from '@/constants/layout';
import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import { darkColors } from '@/lib/colors';

const ACTION_HEIGHT = 38;
const SEND_TOUCH_SIZE = 22;
const SEND_BUTTON_INSET = 8;

export const insightCardActionLayout = {
  height: ACTION_HEIGHT,
  sendTouchSize: SEND_TOUCH_SIZE,
  sendButtonInset: SEND_BUTTON_INSET,
  sendIconSize: Math.round(SEND_TOUCH_SIZE * 0.48),
  voiceHitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

export const insightCardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(33, 33, 33, 0.85)',
    borderRadius: 20,
    minHeight: 340,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.75,
  },
  cardFillParent: {
    flex: 1,
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
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
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
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  descriptionText: {
    fontFamily: instrumentSansFont,
    fontSize: 19,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.62)',
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
    height: ACTION_HEIGHT,
    borderRadius: 69,
    paddingLeft: 14,
    paddingRight: SEND_TOUCH_SIZE + SEND_BUTTON_INSET + 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors['chat-input-pill'],
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
    color: darkColors['chat-label-muted'],
    flexShrink: 1,
  },
  sendButton: {
    position: 'absolute',
    right: SEND_BUTTON_INSET,
    top: (ACTION_HEIGHT - SEND_TOUCH_SIZE) / 2,
    width: SEND_TOUCH_SIZE,
    height: SEND_TOUCH_SIZE,
    borderRadius: SEND_TOUCH_SIZE / 2,
    backgroundColor: `${darkColors['chat-accent-mint']}59`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_HEIGHT / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonEnabled: {
    opacity: 1,
  },
  voiceButtonDisabled: {
    opacity: 0.55,
  },
});

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

export const insightCardImageStyle = { opacity: 0.6, borderRadius: 20 } as const;
