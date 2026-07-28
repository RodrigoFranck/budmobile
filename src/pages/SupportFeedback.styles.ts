import { StyleSheet } from 'react-native';

import { Spacing, Typography } from '@/constants/styles';

export const DARK_COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  primary: '#BBEEEE',
  primaryText: '#1D1916',
  backButtonBackground: 'rgba(255,255,255,0.18)',
} as const;

export const LIGHT_COLORS = {
  background: '#F7F1ED',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1D1916',
  textMuted: 'rgba(29,25,22,0.55)',
  primary: '#2E7D7A',
  primaryText: '#FFFFFF',
  backButtonBackground: 'rgba(29,25,22,0.08)',
} as const;

export type SupportFeedbackColors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  backButtonBackground: string;
};

/** @deprecated Prefer DARK_COLORS / LIGHT_COLORS via createSupportFeedbackStyles */
export const SUPPORT_FEEDBACK_COLORS = DARK_COLORS;

export function createSupportFeedbackStyles(colors: SupportFeedbackColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 18,
    },
    backButton: {
      marginTop: Spacing.md,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backButtonBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: Spacing.lg,
      color: colors.text,
      fontSize: 28,
      fontFamily: 'InriaSerif-Regular',
    },
    subtitle: {
      marginTop: Spacing.md,
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    label: {
      marginTop: Spacing.xl,
      color: colors.textMuted,
      fontSize: 14,
    },
    messageLabel: {
      marginTop: Spacing.lg,
      color: colors.textMuted,
      fontSize: 14,
    },
    inputContainer: {
      marginTop: Spacing.sm,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    input: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
    },
    textareaContainer: {
      minHeight: 220,
    },
    textarea: {
      minHeight: 220,
    },
    sendButton: {
      marginTop: Spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: 10,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.55,
    },
    sendButtonText: {
      color: colors.primaryText,
      fontSize: Typography.base,
      fontWeight: '600',
    },
  });
}
