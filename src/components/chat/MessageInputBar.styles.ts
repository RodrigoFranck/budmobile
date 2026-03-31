import { StyleSheet, type ViewStyle } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { BorderRadius, InputHeight, Spacing, Typography } from '@/constants/styles';
import { ChatConstants } from '@/constants/layout';

export function createMessageInputBarStyles(params: {
  colors: AppColors;
  bottomInset: number;
  isIOS: boolean;
  canSend: boolean;
}) {
  const { colors, bottomInset, isIOS, canSend } = params;

  return StyleSheet.create({
    root: {
      paddingTop: Spacing.md,
      paddingBottom: Math.max(bottomInset, Spacing.base),
      paddingHorizontal: Spacing.base,
      backgroundColor: 'transparent',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    } satisfies ViewStyle,
    inputWrap: {
      flex: 1,
      minHeight: 52,
      maxHeight: ChatConstants.inputMaxHeight + 24,
      borderRadius: BorderRadius.full,
      backgroundColor: colors['chat-input-pill'],
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingLeft: Spacing.base + 2,
      paddingRight: 48,
      paddingVertical: isIOS ? 10 : 8,
    } satisfies ViewStyle,
    textInput: {
      flex: 1,
      fontSize: Typography.base,
      lineHeight: Typography.lineHeight.normal + 2,
      color: colors['chat-body'],
      minHeight: InputHeight.md,
      maxHeight: ChatConstants.inputMaxHeight,
      paddingVertical: 4,
    },
    sendButton: {
      position: 'absolute',
      right: 14,
      bottom: isIOS ? 12 : 10,
      opacity: canSend ? 1 : 0.35,
    } satisfies ViewStyle,
    sendHitSlop: {
      top: 12,
      bottom: 12,
      left: 12,
      right: 12,
    } as const,
  });
}

