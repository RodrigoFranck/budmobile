import React from 'react';
import { View, Text, StyleSheet, Platform, Image, ImageBackground } from 'react-native';

import { fonts } from '@/theme';
import { v3Assets } from '@/theme/assets';

interface SplashScreenProps {
  visible?: boolean;
}

export function SplashScreen({ visible = true }: SplashScreenProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="auto">
      <ImageBackground source={v3Assets.splashTexture} style={styles.fill} imageStyle={styles.texture}>
        <View style={styles.center}>
          <Image source={v3Assets.wordmark} style={styles.wordmark} resizeMode="contain" />
          <Text style={styles.subtitle}>Inteligência artificial para saúde mental</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#171310',
    zIndex: 9999,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texture: {
    resizeMode: 'cover',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  wordmark: {
    width: 200,
    height: 72,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 19,
    letterSpacing: -0.4,
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    color: '#A39C93',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
