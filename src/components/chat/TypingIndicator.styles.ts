import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing } from '@/constants/styles';

export function createTypingIndicatorStyles(params: { colors: AppColors }) {
  const { colors } = params;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: Spacing.sm,
      paddingHorizontal: 2,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors['chat-label-muted'],
    },
  });
}
