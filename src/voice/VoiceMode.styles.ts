import { StyleSheet } from 'react-native';

import type { AppColors } from '@/lib/colors';
import { Spacing, Typography } from '@/constants/styles';

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
      paddingHorizontal: 47,
      paddingTop: topInset + 90,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    transcript: {
      fontFamily: 'Fraunces_400Regular',
      fontSize: 24,
      lineHeight: 32,
      color: colors['chat-label-muted'],
    },
    bottom: {
      paddingBottom: Math.max(bottomInset, 24) + 18,
      paddingHorizontal: 24,
    },
    status: {
      fontFamily: 'InstrumentSans',
      fontSize: 15,
      lineHeight: 20,
      color: colors['chat-label-muted'],
      textAlign: 'center',
      marginBottom: 16,
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
    activityBarsWrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 5,
      height: 44,
    },
    activityBar: {
      width: 4,
      height: 36,
      borderRadius: 2,
      backgroundColor: colors.foreground,
    },
  });
}

