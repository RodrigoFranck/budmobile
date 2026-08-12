import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing } from '@/constants/styles';

export function createVoiceModeStyles(params: {
  colors: AppColors;
  topInset: number;
  bottomInset: number;
}) {
  const { colors, topInset, bottomInset } = params;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors['chat-warm-bg'],
    },
    backButton: {
      position: 'absolute',
      left: Spacing.base,
      top: topInset + Spacing.sm,
      zIndex: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    main: {
      flex: 1,
      paddingHorizontal: 40,
      paddingTop: topInset + 90,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 24,
    },
    // When text overflows, drop vertical centering so Android can scroll the top/bottom.
    scrollContentOverflow: {
      justifyContent: 'flex-start',
    },
    heroLabel: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 36,
      lineHeight: 44,
      color: colors['chat-body'],
      textAlign: 'center',
      marginBottom: 12,
    },
    heroLabelConnecting: {
      color: colors['chat-accent-mint'],
    },
    heroHint: {
      fontFamily: 'InstrumentSans',
      fontSize: 16,
      lineHeight: 22,
      color: colors['chat-body'],
      textAlign: 'center',
      opacity: 0.78,
      maxWidth: 280,
    },
    heroBlock: {
      alignItems: 'center',
    },
    statusHintSpacer: {
      marginBottom: 18,
    },
    transcriptBlock: {
      width: '100%',
      alignItems: 'center',
    },
    transcript: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 24,
      lineHeight: 32,
      color: colors['chat-body'],
      textAlign: 'center',
      width: '100%',
    },
    transcriptStanza: {
      marginTop: 20,
    },
    bottom: {
      paddingBottom: Math.max(bottomInset, 24) + 18,
      paddingHorizontal: 24,
    },
    status: {
      fontFamily: 'InstrumentSans',
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500',
      color: colors['chat-body'],
      textAlign: 'center',
      marginBottom: 8,
    },
    statusHint: {
      fontFamily: 'InstrumentSans',
      fontSize: 14,
      lineHeight: 20,
      color: colors['chat-body'],
      textAlign: 'center',
      opacity: 0.72,
      marginBottom: 18,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    actionButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonMuted: {
      backgroundColor: 'rgba(239, 68, 68, 0.18)',
    },
    actionButtonDisabled: {
      opacity: 0.4,
    },
    activityBarsWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors['chat-body'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityBarsWrapConnecting: {
      backgroundColor: colors['chat-accent-mint'],
    },
    activityBarsWrapPaused: {
      backgroundColor: colors['chat-accent-mint'],
    },
    activityBarsInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      height: 28,
    },
    activityBar: {
      width: 4,
      height: 28,
      borderRadius: 2,
      backgroundColor: colors['chat-warm-bg'],
    },
  });
}
