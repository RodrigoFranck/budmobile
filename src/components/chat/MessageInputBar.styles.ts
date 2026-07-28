import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { BorderRadius, Spacing, Typography } from '@/constants/styles';

import type { MessageInputBarLayout } from '@/components/chat/messageInputBarLayout';

const baseStyles = StyleSheet.create({
  root: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: Typography.base,
    margin: 0,
    paddingRight: 0,
    textAlignVertical: 'top',
  },
  sendButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendHitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  } as const,
  voiceSlot: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});

export function getMessageInputBarStyles(params: {
  colors: AppColors;
  bottomInset: number;
  layout: MessageInputBarLayout;
  prominentVoice?: boolean;
}) {
  const {
    colors,
    bottomInset,
    layout,
    prominentVoice = false,
  } = params;
  const {
    pillHeight,
    sendTouchSize,
    sendButtonInset,
    sendButtonTop,
    textPaddingLeft,
    textLineHeight,
    singleLineVerticalPadding,
  } = layout;
  const sendColumnWidth = sendTouchSize + sendButtonInset;

  return {
    root: [
      baseStyles.root,
      { paddingBottom: Math.max(bottomInset, Spacing.base) },
    ] satisfies ViewStyle[],
    row: baseStyles.row,
    inputWrap: [
      baseStyles.inputWrap,
      {
        backgroundColor: colors['chat-input-pill'],
        height: pillHeight,
        paddingRight: sendColumnWidth,
      },
    ] satisfies ViewStyle[],
    textInput: [
      baseStyles.textInput,
      {
        color: colors['chat-body'],
        height: pillHeight,
        lineHeight: textLineHeight,
        paddingLeft: textPaddingLeft,
        paddingTop: singleLineVerticalPadding,
        paddingBottom: singleLineVerticalPadding,
      },
    ] satisfies TextStyle[],
    sendButton: [
      baseStyles.sendButton,
      {
        width: sendTouchSize,
        height: sendTouchSize,
        right: sendButtonInset,
        top: sendButtonTop,
      },
    ] satisfies ViewStyle[],
    sendHitSlop: baseStyles.sendHitSlop,
    voiceSlot: [
      baseStyles.voiceSlot,
      prominentVoice
        ? {
            minHeight: pillHeight,
            width: layout.prominentVoiceWidth,
          }
        : {
            width: layout.voiceSlotWidth,
            height: pillHeight,
          },
    ] satisfies ViewStyle[],
  };
}
