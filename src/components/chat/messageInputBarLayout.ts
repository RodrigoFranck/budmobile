import { useMemo } from 'react';
import { useWindowDimensions, type ScaledSize } from 'react-native';

import { Spacing, Typography } from '@/constants/styles';

export interface MessageInputBarLayout {
  pillHeight: number;
  singleLineVerticalPadding: number;
  sendTouchSize: number;
  sendButtonInset: number;
  sendButtonTop: number;
  textPaddingLeft: number;
  textLineHeight: number;
  voiceSlotWidth: number;
  prominentVoiceSize: number;
  prominentVoiceWidth: number;
}

const ROW_GAP = 12;

/** Compact single-line pill height as a share of screen height */
const PILL_HEIGHT_SCREEN_RATIO = 0.065;
/** Companion voice button column as a share of screen width */
const VOICE_SLOT_WIDTH_RATIO = 0.11;
/** Prominent voice control is a circle matching pill height */
const PROMINENT_VOICE_WIDTH_RATIO = 1;
/** Send icon touch area as a share of screen width */
const SEND_TOUCH_WIDTH_RATIO = 0.09;
/** Inset from the right curve of the pill to the send icon */
const SEND_BUTTON_INSET_WIDTH_RATIO = 0.012;
/** Text left inset as a share of screen width */
const TEXT_PADDING_LEFT_WIDTH_RATIO = 0.05;

export function getMessageInputBarLayout(
  window: Pick<ScaledSize, 'width' | 'height'>,
): MessageInputBarLayout {
  const { width, height } = window;
  const textLineHeight = Typography.lineHeight.normal;

  const pillHeight = Math.round(height * PILL_HEIGHT_SCREEN_RATIO);
  const singleLineVerticalPadding = Math.max(
    0,
    (pillHeight - textLineHeight) / 2,
  );
  const sendTouchSize = Math.round(
    Math.min(width * SEND_TOUCH_WIDTH_RATIO, pillHeight - 4),
  );
  const sendButtonInset = Math.max(4, Math.round(width * SEND_BUTTON_INSET_WIDTH_RATIO));
  const textPaddingLeft = Math.round(width * TEXT_PADDING_LEFT_WIDTH_RATIO);
  const voiceSlotWidth = Math.round(width * VOICE_SLOT_WIDTH_RATIO);

  return {
    pillHeight,
    singleLineVerticalPadding,
    sendTouchSize,
    sendButtonInset,
    sendButtonTop: (pillHeight - sendTouchSize) / 2,
    textPaddingLeft,
    textLineHeight,
    voiceSlotWidth,
    prominentVoiceSize: pillHeight,
    prominentVoiceWidth: Math.round(pillHeight * PROMINENT_VOICE_WIDTH_RATIO),
  };
}

export function useMessageInputBarLayout(): MessageInputBarLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => getMessageInputBarLayout({ width, height }),
    [width, height],
  );
}
