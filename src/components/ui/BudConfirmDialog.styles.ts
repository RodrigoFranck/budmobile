import { StyleSheet } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/styles';
import { useTheme } from '@/contexts/ThemeContext';

const DARK_DIALOG = {
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  title: '#FFFFFF',
  message: 'rgba(255,255,255,0.82)',
  buttonBg: 'rgba(255,255,255,0.12)',
  cancelText: '#FFFFFF',
  confirmText: '#BBEEEE',
  destructiveText: '#E05252',
  backdrop: 'rgba(0,0,0,0.58)',
} as const;

const LIGHT_DIALOG = {
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  title: '#1D1916',
  message: 'rgba(29,25,22,0.72)',
  buttonBg: 'rgba(29,25,22,0.06)',
  cancelText: '#1D1916',
  confirmText: '#2E7D7A',
  destructiveText: '#E05252',
  backdrop: 'rgba(29,25,22,0.35)',
} as const;

export type BudConfirmDialogColors = {
  card: string;
  cardBorder: string;
  title: string;
  message: string;
  buttonBg: string;
  cancelText: string;
  confirmText: string;
  destructiveText: string;
  backdrop: string;
};

export function useBudConfirmDialogColors(): BudConfirmDialogColors {
  const { mode } = useTheme();
  return mode === 'dark' ? DARK_DIALOG : LIGHT_DIALOG;
}

export function createBudConfirmDialogStyles(colors: BudConfirmDialogColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingTop: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.base,
      gap: Spacing.md,
    },
    title: {
      fontFamily: 'InriaSerif-Bold',
      fontSize: 20,
      lineHeight: 28,
      color: colors.title,
      textAlign: 'center',
    },
    message: {
      fontFamily: 'InriaSerif-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: colors.message,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 10,
      backgroundColor: colors.buttonBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    cancelLabel: {
      fontFamily: 'InriaSerif-Regular',
      fontSize: 17,
      color: colors.cancelText,
      textAlign: 'center',
    },
    confirmLabel: {
      fontFamily: 'InriaSerif-Regular',
      fontSize: 17,
      textAlign: 'center',
    },
    confirmDefault: {
      color: colors.confirmText,
    },
    confirmDestructive: {
      color: colors.destructiveText,
    },
  });
}
