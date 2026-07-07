import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/styles';

export const DARK_COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  icon: 'rgba(255,255,255,0.75)',
  primary: '#BBEEEE',
  backButtonBackground: 'rgba(255,255,255,0.18)',
  switchTrackOff: 'rgba(255,255,255,0.25)',
} as const;

export const LIGHT_COLORS = {
  background: '#F7F1ED',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1D1916',
  icon: 'rgba(29,25,22,0.65)',
  primary: '#2E7D7A',
  backButtonBackground: 'rgba(29,25,22,0.08)',
  switchTrackOff: 'rgba(29,25,22,0.18)',
} as const;

export type SettingsColors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  icon: string;
  primary: string;
  backButtonBackground: string;
  switchTrackOff: string;
};

export const HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => index + 6);

export function createSettingsStyles(colors: SettingsColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: Spacing.md,
      gap: Spacing.base,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backButtonBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 18,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowText: {
      color: colors.text,
      fontSize: 22,
      fontFamily: 'InriaSerif-Regular',
    },
    rowTextValue: {
      color: colors.primary,
      fontSize: 18,
      fontFamily: 'InriaSerif-Regular',
    },
    rightSlot: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    switch: {
      transform: [{ translateY: -1 }],
    },
    footer: {
      marginTop: 'auto',
      paddingTop: Spacing.xl,
      gap: Spacing.md,
      alignItems: 'center',
    },
    footerDisclaimer: {
      color: colors.icon,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
    },
    footerLegal: {
      color: colors.icon,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    legalLink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    destructiveText: {
      color: '#E05252',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 24,
      maxHeight: '50%',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontFamily: 'InriaSerif-Regular',
      marginBottom: 12,
    },
    hourOption: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    hourOptionText: {
      color: colors.text,
      fontSize: 18,
      fontFamily: 'InriaSerif-Regular',
    },
    hourOptionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}
