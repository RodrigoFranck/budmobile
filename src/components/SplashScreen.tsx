import React from 'react';
import { View, Text, StyleSheet, Platform, Image, ImageBackground } from 'react-native';

import { fonts, useV3Asset, useV3Colors } from '@/theme';

interface SplashScreenProps {
  visible?: boolean;
}

export function SplashScreen({ visible = true }: SplashScreenProps) {
  const colors = useV3Colors();
  const assets = useV3Asset();

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]} pointerEvents="auto">
      <ImageBackground source={assets.splashTexture} style={styles.fill} imageStyle={styles.texture}>
        <View style={styles.center}>
          <Image source={assets.wordmark} style={styles.wordmark} resizeMode="contain" />
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Inteligência artificial para saúde mental
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
    height: 97,
  },
  subtitle: {
    marginTop: 13,
    fontSize: 19,
    letterSpacing: -0.4,
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
