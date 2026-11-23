import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { PlanPrices } from '@/billing/prices';
import { fonts, useV3Colors } from '@/theme';
import {
  PaywallMessageIcon,
  PaywallMicIcon,
  PaywallSparkleIcon,
} from '@/pages/paywall/paywallIcons';

export type PaywallInterval = 'monthly' | 'annual';

const FEATURES = [
  { text: 'Conversas sem limite', Icon: PaywallMessageIcon },
  { text: 'Memória que liga os pontos entre as conversas', Icon: PaywallSparkleIcon },
  { text: 'Converse por voz quando quiser', Icon: PaywallMicIcon },
] as const;

const ANNUAL_SAVE_LABEL = 'economize 30%';
const FIGMA_PRICE_ANNUAL = 42;
const FIGMA_PRICE_MONTHLY = 46;
const FIGMA_PRICE_WIDTH_ANNUAL = 210;
const FIGMA_PRICE_WIDTH_MONTHLY = 160;
const SUFFIX_AND_BADGE = 8 + 50 + 12 + 108;

export function PaywallOfferCard({
  interval,
  onChangeInterval,
  prices,
}: {
  interval: PaywallInterval;
  onChangeInterval: (interval: PaywallInterval) => void;
  prices: PlanPrices;
}) {
  const colors = useV3Colors();
  const { width: screenWidth } = useWindowDimensions();
  const annual = interval === 'annual';
  const cardMargin = 20;
  const cardPad = 22;
  const inner = screenWidth - cardMargin * 2 - cardPad * 2;
  const figmaPrice = annual ? FIGMA_PRICE_ANNUAL : FIGMA_PRICE_MONTHLY;
  const figmaWidth = annual ? FIGMA_PRICE_WIDTH_ANNUAL : FIGMA_PRICE_WIDTH_MONTHLY;
  const priceSize = Math.min(
    figmaPrice,
    Math.max(34, Math.round(figmaPrice * ((inner - SUFFIX_AND_BADGE) / figmaWidth))),
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, marginHorizontal: cardMargin, paddingHorizontal: cardPad },
      ]}
    >
      <View style={[styles.planSwitch, { backgroundColor: colors.surface2 }]}>
        {(['monthly', 'annual'] as const).map((option) => {
          const active = interval === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChangeInterval(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option === 'annual' ? `Anual, ${ANNUAL_SAVE_LABEL}` : 'Mensal'}
              style={[styles.planTab, active ? { backgroundColor: colors.btn } : null]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumScaleFactor={0.9}
                style={[styles.planTabText, { color: active ? colors.onBtn : colors.text2 }]}
              >
                {option === 'annual' ? `Anual · ${ANNUAL_SAVE_LABEL}` : 'Mensal'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.priceRow, annual ? null : styles.priceRowMonthly]}>
        <View style={styles.priceGroup}>
          <Text
            accessibilityLabel={
              annual
                ? `Cobrado ${prices.annualTotal} por ano`
                : `Cobrado ${prices.monthly} por mês`
            }
            style={[
              styles.price,
              { color: colors.text, fontSize: priceSize, lineHeight: annual ? 46 : priceSize },
            ]}
          >
            {annual ? prices.annualTotal : prices.monthly}
          </Text>
          <Text style={[styles.priceSuffix, { color: colors.text2 }]}>
            {annual ? '/ ano' : '/ mês'}
          </Text>
        </View>
        {annual ? (
          <View style={styles.badgeCol}>
            <View style={[styles.bestBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.bestBadgeText, { color: colors.onAccent }]}>Melhor valor</Text>
            </View>
          </View>
        ) : null}
      </View>

      <Text style={[styles.billedHint, { color: colors.text3 }]}>
        {annual
          ? `Equivale a ${prices.annualPerMonth}/mês · ${ANNUAL_SAVE_LABEL}`
          : 'Cobrado todo mês'}
      </Text>

      <View style={[styles.rule, { backgroundColor: colors.line }]} />

      {FEATURES.map((feature) => (
        <View key={feature.text} style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <feature.Icon color={colors.accent} />
          </View>
          <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    paddingTop: 20,
    paddingBottom: 24,
  },
  planSwitch: {
    borderRadius: 28,
    padding: 4,
    flexDirection: 'row',
  },
  planTab: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 0,
  },
  planTabText: {
    width: '100%',
    textAlign: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 70,
    paddingTop: 24,
    gap: 8,
  },
  priceRowMonthly: {
    alignItems: 'flex-end',
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexShrink: 0,
  },
  price: {
    fontFamily: fonts.display,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  priceSuffix: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 17,
    includeFontPadding: false,
  },
  badgeCol: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  bestBadge: {
    height: 30,
    borderRadius: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  bestBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 13,
  },
  billedHint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    paddingTop: 10,
  },
  rule: {
    height: 1,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
  },
  featureIcon: {
    width: 22,
    height: 22,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
  },
});
