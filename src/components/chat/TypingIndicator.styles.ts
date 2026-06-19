import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing } from '@/constants/styles';

export function createTypingIndicatorStyles(params: { colors: AppColors }) {
  const { colors } = params;

  return StyleSheet.create({
    wrap: {
      paddingVertical: Spacing.sm,
      alignItems: 'flex-start',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: colors['chat-input-pill'],
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors['chat-label-muted'],
    },
  });
}
