import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/styles';

export const DARK_COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  icon: 'rgba(255,255,255,0.75)',
  backButtonBackground: 'rgba(255,255,255,0.18)',
  buttonBackground: 'rgba(255,255,255,0.12)',
} as const;

export const LIGHT_COLORS = {
  background: '#F7F1ED',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1D1916',
  icon: 'rgba(29,25,22,0.65)',
  backButtonBackground: 'rgba(29,25,22,0.08)',
  buttonBackground: 'rgba(29,25,22,0.08)',
} as const;

export type CrisisResourcesColors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  icon: string;
  backButtonBackground: string;
  buttonBackground: string;
};

export function createCrisisResourcesStyles(colors: CrisisResourcesColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: Spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backButtonBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: 'InriaSerif-Regular',
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 18,
    },
  });
}
