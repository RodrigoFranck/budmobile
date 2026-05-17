import { StyleSheet, type ViewStyle } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { BorderRadius, Spacing, Typography } from '@/constants/styles';
import { ChatConstants } from '@/constants/layout';

export const MessageInputBarMetrics = {
  pillHeight: 52,
  sendTouchSize: 40,
} as const;

export function createMessageInputBarStyles(params: {
  colors: AppColors;
  bottomInset: number;
  canSend: boolean;
  isMultiline: boolean;
}) {
  const { colors, bottomInset, canSend, isMultiline } = params;
  const { pillHeight, sendTouchSize } = MessageInputBarMetrics;

  return StyleSheet.create({
    root: {
      paddingTop: Spacing.md,
      paddingBottom: Math.max(bottomInset, Spacing.base),
      paddingHorizontal: Spacing.base,
      backgroundColor: 'transparent',
    },
    row: {
      flexDirection: 'row',
      alignItems: isMultiline ? 'flex-end' : 'center',
      gap: 12,
    } satisfies ViewStyle,
    inputWrap: {
      flex: 1,
      minHeight: pillHeight,
      height: isMultiline ? undefined : pillHeight,
      maxHeight: ChatConstants.inputMaxHeight + 24,
      borderRadius: BorderRadius.full,
      backgroundColor: colors['chat-input-pill'],
      flexDirection: 'row',
      alignItems: isMultiline ? 'flex-end' : 'center',
      paddingLeft: Spacing.base + 2,
      paddingRight: Spacing.sm,
    } satisfies ViewStyle,
    textInput: {
      flex: 1,
      fontSize: Typography.base,
      lineHeight: Typography.lineHeight.normal,
      color: colors['chat-body'],
      maxHeight: ChatConstants.inputMaxHeight,
      paddingTop: 0,
      paddingBottom: 0,
      margin: 0,
      textAlignVertical: isMultiline ? 'top' : 'center',
    },
    sendButton: {
      width: sendTouchSize,
      height: sendTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: canSend ? 1 : 0.35,
    } satisfies ViewStyle,
    sendHitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    } as const,
    voiceSlot: {
      height: pillHeight,
      justifyContent: 'center',
      alignItems: 'center',
    } satisfies ViewStyle,
  });
}
