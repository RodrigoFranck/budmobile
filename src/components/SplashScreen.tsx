import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { frauncesFont } from '@/constants/onboardingTheme';

interface SplashScreenProps {
  visible?: boolean;
}

/** Figma Splash Screen 2 — always dark brand launch, independent of app theme. */
export function SplashScreen({ visible = true }: SplashScreenProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      <Text style={styles.budText}>Bud.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1D1916',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  budText: {
    fontSize: 96,
    fontWeight: '400',
    fontFamily: frauncesFont,
    color: '#77716C',
    textAlign: 'center',
    lineHeight: 96,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
