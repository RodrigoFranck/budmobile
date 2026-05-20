import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { frauncesFont, instrumentSansFont } from '@/constants/onboardingTheme';
import { useActivitiesTheme, type ActivitiesThemeTokens } from '@/lib/activitiesTheme';

export function createCheckInFlowStyles(t: ActivitiesThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      gap: 12,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.controlBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.progressTrack,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: t.progressFill,
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 24,
    },
    category: {
      fontFamily: instrumentSansFont,
      fontSize: 11,
      letterSpacing: 2.2,
      color: t.muted,
      textTransform: 'uppercase',
    },
    question: {
      fontFamily: frauncesFont,
      fontSize: 26,
      lineHeight: 34,
      color: t.foreground,
      marginTop: 12,
    },
    subtitle: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      lineHeight: 20,
      color: t.subtle,
      marginTop: 8,
    },
    inputArea: {
      marginTop: 28,
      flex: 1,
    },
    footer: {
      paddingHorizontal: 30,
      paddingTop: 12,
    },
    primaryButton: {
      height: 48,
      borderRadius: 24,
      backgroundColor: t.ctaBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.35,
    },
    primaryButtonLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 15,
      color: t.ctaText,
    },
    stepCounter: {
      fontFamily: instrumentSansFont,
      fontSize: 12,
      color: t.muted,
      textAlign: 'center',
      marginTop: 10,
    },
    sliderValue: {
      fontFamily: frauncesFont,
      fontSize: 64,
      color: t.foreground,
      textAlign: 'center',
      marginBottom: 32,
      fontWeight: '300',
      minWidth: 72,
      fontVariant: ['tabular-nums'],
    },
    sliderTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: t.progressTrack,
      position: 'relative',
      justifyContent: 'center',
    },
    sliderFill: {
      position: 'absolute',
      left: 0,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.progressFill,
    },
    sliderThumb: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: t.sliderThumb,
      marginLeft: -10,
      top: -8,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    sliderLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 12,
      color: t.muted,
      maxWidth: '45%',
    },
    chipOption: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.chipBorder,
      backgroundColor: t.chipBg,
      paddingHorizontal: 20,
      marginBottom: 10,
      justifyContent: 'center',
    },
    chipOptionCompact: {
      height: 42,
      borderRadius: 21,
    },
    chipOptionWithSubtitle: {
      minHeight: 52,
      paddingVertical: 10,
    },
    chipOptionSelected: {
      backgroundColor: t.chipSelectedBg,
      borderColor: t.chipSelectedBg,
    },
    chipLabel: {
      fontFamily: instrumentSansFont,
      fontSize: 14,
      color: t.chipText,
    },
    chipLabelSelected: {
      color: t.chipSelectedText,
    },
    chipSubtitle: {
      fontFamily: instrumentSansFont,
      fontSize: 11,
      color: t.muted,
      marginTop: 2,
    },
    chipSubtitleSelected: {
      color: t.chipSubtitleSelected,
    },
    textInput: {
      minHeight: 120,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.chipBorder,
      backgroundColor: t.chipBg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: instrumentSansFont,
      fontSize: 15,
      lineHeight: 22,
      color: t.foreground,
    },
  });
}

export function useCheckInFlowStyles() {
  const theme = useActivitiesTheme();
  return useMemo(() => createCheckInFlowStyles(theme), [theme]);
}
