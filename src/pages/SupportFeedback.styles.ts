import { StyleSheet } from 'react-native';

import { Spacing, Typography } from '@/constants/styles';

export const SUPPORT_FEEDBACK_COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  primary: '#BBEEEE',
  primaryText: '#1D1916',
} as const;

export const supportFeedbackStyles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: SUPPORT_FEEDBACK_COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
  },
  backButton: {
    marginTop: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: Spacing.lg,
    color: SUPPORT_FEEDBACK_COLORS.text,
    fontSize: 28,
    fontFamily: 'InriaSerif-Regular',
  },
  subtitle: {
    marginTop: Spacing.md,
    color: SUPPORT_FEEDBACK_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    marginTop: Spacing.xl,
    color: SUPPORT_FEEDBACK_COLORS.textMuted,
    fontSize: 14,
  },
  messageLabel: {
    marginTop: Spacing.lg,
    color: SUPPORT_FEEDBACK_COLORS.textMuted,
    fontSize: 14,
  },
  inputContainer: {
    marginTop: Spacing.sm,
    backgroundColor: SUPPORT_FEEDBACK_COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SUPPORT_FEEDBACK_COLORS.cardBorder,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: SUPPORT_FEEDBACK_COLORS.text,
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
    backgroundColor: SUPPORT_FEEDBACK_COLORS.primary,
    borderRadius: 10,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: SUPPORT_FEEDBACK_COLORS.primaryText,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
