import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatRenovaEmLabel,
  isFreeQuotaLow,
} from '@/billing/freeQuota';
import { fonts, useV3Colors } from '@/theme';

/**
 * TF-115 · Figma 04_chat_free_cota 307:2/307:111 · baixa 307:56/307:165
 * Thin remaining-quota bar above the Free chat composer. No numbers/tokens.
 */
export function FreeQuotaBar({
  cotaRestantePct,
  renovaEm,
  onPressAssinar,
}: {
  cotaRestantePct: number;
  renovaEm: string | null;
  onPressAssinar: () => void;
}) {
  const colors = useV3Colors();
  const low = isFreeQuotaLow(cotaRestantePct);
  const width = useRef(new Animated.Value(Math.max(0, Math.min(100, cotaRestantePct)))).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.max(0, Math.min(100, cotaRestantePct)),
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [cotaRestantePct, width]);

  const fillColor = low ? colors.accent : colors.text3;
  const labelColor = low ? colors.text2 : colors.text3;

  return (
    <View style={styles.root} accessibilityRole="summary">
      <View style={styles.labels}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {low ? 'Falta pouco da conversa grátis' : 'Sua conversa grátis deste mês'}
        </Text>
        {low ? (
          <Pressable
            onPress={onPressAssinar}
            accessibilityRole="button"
            accessibilityLabel="Assinar"
            hitSlop={8}
          >
            <Text style={[styles.assinar, { color: colors.accent }]}>Assinar</Text>
          </Pressable>
        ) : (
          <Text style={[styles.label, { color: colors.text3 }]} numberOfLines={1}>
            {formatRenovaEmLabel(renovaEm)}
          </Text>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              width: width.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    gap: 8,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13,
  },
  assinar: {
    flexShrink: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 13,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
