import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { CrisisResources } from '@/components/CrisisResources';
import { Spacing } from '@/constants/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { NavigationProp } from '@/types/navigation';

const DARK_COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  icon: 'rgba(255,255,255,0.75)',
} as const;

const LIGHT_COLORS = {
  background: '#F7F1ED',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1D1916',
  icon: 'rgba(29,25,22,0.65)',
} as const;

type Colors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  icon: string;
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
      backgroundColor:
        colors === DARK_COLORS ? 'rgba(255,255,255,0.18)' : 'rgba(29,25,22,0.08)',
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

export default function CrisisResourcesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const darkMode = mode === 'dark';

  const colors = useMemo(() => (darkMode ? DARK_COLORS : LIGHT_COLORS), [darkMode]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Settings');
    }
  }, [navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.75}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Recursos de crise</Text>

        <View style={styles.card}>
          <CrisisResources
            textColor={colors.text}
            subtextColor={colors.icon}
            buttonBackground={darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(29,25,22,0.08)'}
            buttonTextColor={colors.text}
          />
        </View>
      </ScrollView>
    </View>
  );
}
