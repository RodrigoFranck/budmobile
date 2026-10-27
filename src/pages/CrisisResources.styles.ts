import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/styles';

export const DARK_COLORS = {
  background: '#171310',
  card: '#201B18',
  cardBorder: '#3A332D',
  text: '#F1E6DB',
  icon: '#A39C93',
  backButtonBackground: '#2A2522',
  buttonBackground: '#2A2522',
} as const;

export const LIGHT_COLORS = {
  background: '#F1E6DB',
  card: '#E5D8CA',
  cardBorder: '#D3C3B2',
  text: '#35302B',
  icon: '#6E655C',
  backButtonBackground: '#DCCDBD',
  buttonBackground: '#DCCDBD',
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
