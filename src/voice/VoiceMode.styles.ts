import { StyleSheet } from 'react-native';

import { fonts, type V3Colors } from '@/theme';

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
    header: {
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSpacer: {
      width: 48,
      height: 48,
    },
    main: {
      flex: 1,
      paddingHorizontal: 34,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      // stretch so transcript Text gets a finite width and wraps (alignItems:
      // 'center' lets the line grow unbound and spill off-screen).
      alignItems: 'stretch',
      paddingBottom: 24,
    },
    scrollContentOverflow: {
      justifyContent: 'flex-start',
      paddingTop: 40,
    },
    statusLabel: {
      fontFamily: fonts.sansSemi,
      fontSize: 11.5,
      lineHeight: 11.5,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: colors.text3,
      textAlign: 'center',
      alignSelf: 'center',
      marginBottom: 28,
    },
    transcriptPressable: {
      alignSelf: 'stretch',
      width: '100%',
    },
    transcriptBlock: {
      alignSelf: 'stretch',
      width: '100%',
    },
    transcriptStanzaWrap: {
      alignSelf: 'stretch',
      width: '100%',
    },
    transcript: {
      fontFamily: fonts.display,
      fontSize: 32,
      lineHeight: 42,
      letterSpacing: -0.4,
      color: colors.text,
      textAlign: 'center',
      width: '100%',
    },
    transcriptAccent: {
      fontFamily: fonts.displayItalic,
      color: colors.accent,
    },
    transcriptStanza: {
      marginTop: 20,
    },
    bottom: {
      paddingBottom: Math.max(bottomInset, 24),
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    circleButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleButtonDisabled: {
      opacity: 0.4,
    },
    circleButtonMuted: {
      backgroundColor: 'rgba(196, 92, 74, 0.18)',
    },
    endWrap: {
      flex: 1,
      alignItems: 'flex-end',
    },
    endButton: {
      height: 52,
      borderRadius: 29,
      backgroundColor: colors.btn,
      paddingHorizontal: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    endLabel: {
      fontFamily: fonts.sansSemi,
      fontSize: 17,
      lineHeight: 17,
      color: colors.onBtn,
    },
  });
}
