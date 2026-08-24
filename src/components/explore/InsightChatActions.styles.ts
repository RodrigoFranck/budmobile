import { StyleSheet } from 'react-native';

import { instrumentSansFont } from '@/constants/onboardingTheme';
import type { AppColors } from '@/lib/colors';

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

export function createInsightChatActionsStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    messageButton: {
      flex: 1,
      height: ACTION_HEIGHT,
      borderRadius: 69,
      paddingLeft: 14,
      paddingRight: SEND_TOUCH_SIZE + SEND_BUTTON_INSET + 4,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors['chat-input-pill'],
    },
    messageButtonDisabled: {
      opacity: 0.55,
    },
    messageLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: colors['chat-label-muted'],
      flexShrink: 1,
    },
    sendButton: {
      position: 'absolute',
      right: SEND_BUTTON_INSET,
      top: (ACTION_HEIGHT - SEND_TOUCH_SIZE) / 2,
      width: SEND_TOUCH_SIZE,
      height: SEND_TOUCH_SIZE,
      borderRadius: SEND_TOUCH_SIZE / 2,
      backgroundColor: `${colors['chat-accent-mint']}59`,
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
    voiceButtonDisabled: {
      opacity: 0.55,
    },
  });
}
