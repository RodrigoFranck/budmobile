import { View, Text, StyleSheet } from 'react-native';

import { HEALTH_DISCLAIMER } from '@/constants/healthSafety';

type HealthDisclaimerProps = {
  variant?: 'light' | 'dark';
};

const VARIANTS = {
  light: {
    background: 'rgba(255, 255, 255, 0.85)',
    text: '#4A4A4A',
    border: 'rgba(74, 74, 74, 0.15)',
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.06)',
    text: 'rgba(255, 255, 255, 0.65)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export function HealthDisclaimer({ variant = 'light' }: HealthDisclaimerProps) {
  const colors = VARIANTS[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      accessibilityRole="text"
      accessibilityLabel={HEALTH_DISCLAIMER}
    >
      <Text style={[styles.text, { color: colors.text }]}>{HEALTH_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
