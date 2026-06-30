import { Platform, StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';

export function createAppAlertStyles(colors: AppColors, isDarkMode: boolean) {
  const primaryButtonBg = isDarkMode ? colors.primary : '#1E3A5F';
  const primaryButtonText = isDarkMode ? colors['primary-foreground'] : '#FFFFFF';
  const destructiveBg = colors.destructive;
  const destructiveText = colors['destructive-foreground'];

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontFamily: 'InriaSerif-Regular',
      color: isDarkMode ? colors['card-foreground'] : '#1E3A5F',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 28,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    },
    message: {
      fontSize: 15,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      color: colors['muted-foreground'],
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    buttonsColumn: {
      gap: 10,
    },
    button: {
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    buttonPrimary: {
      backgroundColor: primaryButtonBg,
    },
    buttonCancel: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : 'rgba(30, 58, 95, 0.25)',
    },
    buttonDestructive: {
      backgroundColor: destructiveBg,
    },
    buttonTextPrimary: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      color: primaryButtonText,
    },
    buttonTextCancel: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      color: isDarkMode ? colors['card-foreground'] : '#1E3A5F',
    },
    buttonTextDestructive: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      color: destructiveText,
    },
  });
}
