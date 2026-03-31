import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SplashScreenProps {
  visible?: boolean;
}

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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  budText: {
    fontSize: 48,
    fontWeight: '400',
    fontFamily: 'InriaSerif-Regular',
    color: '#466080',
    textAlign: 'center',
  },
});

