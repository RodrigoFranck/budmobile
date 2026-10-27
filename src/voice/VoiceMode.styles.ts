import { StyleSheet } from 'react-native';

import { fonts, type V3Colors } from '@/theme';
import { Spacing } from '@/constants/styles';

export function createVoiceModeStyles(params: {
  colors: V3Colors;
  topInset: number;
  bottomInset: number;
}) {
  const { colors, topInset, bottomInset } = params;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    backButton: {
      position: 'absolute',
      left: Spacing.base,
      top: topInset + Spacing.sm,
      zIndex: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface2,
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
    scrollContentOverflow: {
      justifyContent: 'flex-start',
    },
    heroLabel: {
      fontFamily: fonts.display,
      fontSize: 36,
      lineHeight: 44,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    heroLabelConnecting: {
      color: colors.accent,
    },
    heroHint: {
      fontFamily: fonts.sans,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text2,
      textAlign: 'center',
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
      fontFamily: fonts.display,
      fontSize: 24,
      lineHeight: 32,
      color: colors.text,
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
      fontFamily: fonts.sansSemi,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    statusHint: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text2,
      textAlign: 'center',
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
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonMuted: {
      backgroundColor: 'rgba(196, 92, 74, 0.18)',
    },
    actionButtonDisabled: {
      opacity: 0.4,
    },
    activityBarsWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.btn,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityBarsWrapConnecting: {
      backgroundColor: colors.accent,
    },
    activityBarsWrapPaused: {
      backgroundColor: colors.accent,
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
      backgroundColor: colors.bg,
    },
  });
}
