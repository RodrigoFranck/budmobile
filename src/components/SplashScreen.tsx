import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<1 | 2>(1);

  useEffect(() => {
    // Splash Screen 1: Tela escura vazia (500ms)
    const timer1 = setTimeout(() => {
      setCurrentScreen(2);
    }, 500);

    // Splash Screen 2: Tela escura com "Bud." (1500ms)
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <View style={styles.container}>
      {currentScreen === 2 && (
        <Text style={styles.budText}>Bud.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budText: {
    fontSize: 48,
    fontWeight: '400',
    fontFamily: 'InriaSerif-Regular',
    color: '#466080',
    textAlign: 'center',
  },
});

