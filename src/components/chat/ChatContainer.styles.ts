import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing } from '@/constants/styles';

export function createChatContainerStyles(params: {
  colors: AppColors;
  topPadding: number;
}) {
  const { colors, topPadding } = params;

  return StyleSheet.create({
    list: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: Spacing.base + 4,
      paddingTop: topPadding,
      paddingBottom: Spacing.sm,
    },
    contentContainerAnchored: {
      justifyContent: 'flex-end',
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
  });
}

