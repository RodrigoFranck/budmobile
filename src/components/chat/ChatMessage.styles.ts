import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Typography } from '@/constants/styles';

export function createChatMessageStyles(params: { colors: AppColors }) {
  const { colors } = params;

  return StyleSheet.create({
    contextText: {
      fontSize: Typography.sm,
      lineHeight: Typography.lineHeight.relaxed,
    },
    label: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: Typography.sm,
      fontStyle: 'italic',
      color: colors['chat-label-muted'],
      marginBottom: 6,
    },
    body: {
      fontSize: Typography.base,
      lineHeight: Typography.lineHeight.relaxed + 4,
      color: colors['chat-body'],
      maxWidth: '92%',
    },
    streamingCursor: {
      opacity: 0.45,
    },
  });
}

