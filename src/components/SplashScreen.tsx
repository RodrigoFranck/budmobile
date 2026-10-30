import React from 'react';
import { View, Text, StyleSheet, Platform, Image, ImageBackground } from 'react-native';

import { fonts, useV3Asset, useV3Colors, v3Assets, v3DarkColors } from '@/theme';

interface SplashScreenProps {
  visible?: boolean;
  appearance?: 'theme' | 'launch';
  showSubtitle?: boolean;
}

interface LaunchSplashProps {
  showSubtitle?: boolean;
}

export function LaunchSplash({ showSubtitle = true }: LaunchSplashProps) {
  return (
    <View style={[styles.container, { backgroundColor: v3DarkColors.bg }]} pointerEvents="auto">
      <ImageBackground
        source={v3Assets.splashTextureDark}
        style={styles.fill}
        imageStyle={styles.texture}
      >
        <View style={styles.center}>
          <Image source={v3Assets.wordmarkDark} style={styles.wordmark} resizeMode="contain" />
          {showSubtitle ? (
            <Text style={[styles.subtitle, { color: v3DarkColors.text2 }]}>
              Inteligência artificial para saúde mental
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}

export function SplashScreen({
  visible = true,
  appearance = 'theme',
  showSubtitle = true,
}: SplashScreenProps) {
  const colors = useV3Colors();
  const assets = useV3Asset();

  if (!visible) return null;
  if (appearance === 'launch') {
    return <LaunchSplash showSubtitle={showSubtitle} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]} pointerEvents="auto">
      <ImageBackground source={assets.splashTexture} style={styles.fill} imageStyle={styles.texture}>
        <View style={styles.center}>
          <Image source={assets.wordmark} style={styles.wordmark} resizeMode="contain" />
          {showSubtitle ? (
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              Inteligência artificial para saúde mental
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
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
