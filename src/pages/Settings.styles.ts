import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/styles';

export const DARK_COLORS = {
  background: '#171310',
  card: '#201B18',
  cardBorder: '#3A332D',
  text: '#F1E6DB',
  icon: '#A39C93',
  primary: '#B0EDEE',
  backButtonBackground: '#2A2522',
  switchTrackOff: '#3A332D',
} as const;

export const LIGHT_COLORS = {
  background: '#F1E6DB',
  card: '#E5D8CA',
  cardBorder: '#D3C3B2',
  text: '#35302B',
  icon: '#6E655C',
  primary: '#2E7F7C',
  backButtonBackground: '#DCCDBD',
  switchTrackOff: '#D3C3B2',
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
  });
}
