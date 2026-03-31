import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing } from '@/constants/styles';

export function createChatContainerStyles(params: {
  colors: AppColors;
  inputBarHeight: number;
  topPadding: number;
}) {
  const { colors, inputBarHeight, topPadding } = params;

  return StyleSheet.create({
    list: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: Spacing.base + 4,
      paddingTop: topPadding,
      paddingBottom: inputBarHeight + Spacing.lg,
      flexGrow: 1,
    },
    emptyPrompt: {
      paddingVertical: Spacing['3xl'],
    },
    dateDividerText: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 15,
      color: colors['muted-foreground'],
    },
    emptyTitle: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 24,
      color: colors.foreground,
      textAlign: 'center',
      marginTop: Spacing.md,
      opacity: 0.92,
    },
    footerWrap: {
      paddingVertical: Spacing.sm,
    },
    footerText: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 14,
      fontStyle: 'italic',
      color: colors['chat-label-muted'],
    },
  });
}

