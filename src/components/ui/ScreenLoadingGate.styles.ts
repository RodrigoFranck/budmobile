import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';

export function createScreenLoadingGateStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    loadingRoot: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    skeletonBlock: {
      borderRadius: 16,
      backgroundColor: colors.muted,
      marginBottom: 16,
    },
    skeletonLine: {
      height: 14,
      borderRadius: 8,
      backgroundColor: colors.muted,
      marginBottom: 10,
    },
  });
}
