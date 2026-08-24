import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';

export function createTextChatScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors['chat-warm-bg'],
    },
    keyboard: {
      flex: 1,
    },
  });
}
