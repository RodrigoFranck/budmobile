import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { CrisisResources } from '@/components/CrisisResources';
import { Spacing } from '@/constants/styles';
import { useTheme } from '@/contexts/ThemeContext';
import type { NavigationProp } from '@/types/navigation';
import {
  createCrisisResourcesStyles,
  DARK_COLORS,
  LIGHT_COLORS,
} from '@/pages/CrisisResources.styles';

export default function CrisisResourcesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const darkMode = mode === 'dark';

  const colors = useMemo(() => (darkMode ? DARK_COLORS : LIGHT_COLORS), [darkMode]);
  const styles = useMemo(() => createCrisisResourcesStyles(colors), [colors]);

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
            buttonBackground={colors.buttonBackground}
            buttonTextColor={colors.text}
          />
        </View>
      </ScrollView>
    </View>
  );
}
