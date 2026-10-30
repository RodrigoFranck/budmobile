import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/healthSafety';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { AccentTitle } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import {
  PaywallCheckIcon,
  PaywallLeafIcon,
  PaywallMessageIcon,
  PaywallSparkleIcon,
} from '@/pages/paywall/paywallIcons';

type PaywallRoute = RouteProp<MainTabParamList, 'Paywall'>;
type PlanInterval = 'monthly' | 'annual';

const FEATURES = [
  {
    title: 'Acesso completo',
    description: 'Converse sempre que precisar, por texto ou voz',
    Icon: PaywallMessageIcon,
  },
  {
    title: 'Memória que acompanha você',
    description: 'O Bud lembra da sua história e liga os pontos com o tempo',
    Icon: PaywallSparkleIcon,
  },
  {
    title: 'Feito com especialistas',
    description: 'Baseado em abordagens da psicologia para você se entender melhor',
    Icon: PaywallLeafIcon,
  },
] as const;

const CVV_URL = 'https://www.cvv.org.br';

export default function PaywallScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PaywallRoute>();
  const { showAlert } = useAppAlert();
  const { startCheckout, restorePurchases } = useUserPlan();
  const [interval, setInterval] = useState<PlanInterval>(route.params?.interval ?? 'annual');
  const [submitting, setSubmitting] = useState(false);
  const annual = interval === 'annual';

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      await startCheckout(interval);
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      navigation.goBack();
      return;
    }
    showAlert({
      title: 'Nenhuma compra para restaurar',
      message: 'Quando a cobrança estiver ativa, suas compras da loja voltam para esta conta por aqui.',
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={assets.paywallMist}
          style={[StyleSheet.absoluteFill, styles.mist]}
          resizeMode="cover"
          accessible={false}
        />
      </View>

      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 4, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View style={styles.header}>
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={() => navigation.goBack()} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AccentTitle before="Siga crescendo com o " accent="Bud" />
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Você chegou ao fim das suas conversas grátis. Assine para continuar conversando.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <feature.Icon color={colors.accent} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.text2 }]}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.plans}>
          <PlanCard
            selected={annual}
            label="Anual"
            badge="Economize 36%"
            billed="Cobrado R$ 999,90 por ano"
            price="R$ 83,33"
            onPress={() => setInterval('annual')}
          />
          <PlanCard
            selected={!annual}
            label="Mensal"
            billed="Cobrado todo mês"
            price="R$ 129,90"
            onPress={() => setInterval('monthly')}
          />
        </View>

        <Text style={[styles.renew, { color: colors.text2 }]}>
          {'Renova em '}
          <Text style={{ fontFamily: fonts.sansSemi, color: colors.text }}>
            {annual ? 'R$ 999,90 por ano' : 'R$ 129,90 por mês'}
          </Text>
          {' · cancele quando quiser'}
        </Text>

        <BudButton
          label="Assinar"
          loading={submitting}
          onPress={() => void handleSubscribe()}
          style={styles.subscribe}
        />

        <View style={styles.legalRow}>
          <Pressable onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)} accessibilityRole="link">
            <Text style={[styles.legal, { color: colors.text3 }]}>Termos</Text>
          </Pressable>
          <Text style={[styles.legal, { color: colors.text3 }]}> · </Text>
          <Pressable onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
            <Text style={[styles.legal, { color: colors.text3 }]}>Privacidade</Text>
          </Pressable>
          <Text style={[styles.legal, { color: colors.text3 }]}> · </Text>
          <Pressable onPress={() => void handleRestore()} accessibilityRole="button">
            <Text style={[styles.legal, { color: colors.text3 }]}>Restaurar compra</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => void Linking.openURL(CVV_URL)}
          accessibilityRole="link"
          accessibilityLabel="Preciso de ajuda agora"
          style={styles.helpHit}
        >
          <Text style={[styles.help, { color: colors.accent }]}>Preciso de ajuda agora</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  label,
  badge,
  billed,
  price,
  onPress,
}: {
  selected: boolean;
  label: string;
  badge?: string;
  billed: string;
  price: string;
  onPress: () => void;
}) {
  const colors = useV3Colors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${price} por mês`}
      style={[
        styles.planCard,
        selected
          ? { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accent }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
      ]}
    >
      <View
        style={[
          styles.radio,
          selected
            ? { backgroundColor: colors.accent, borderWidth: 0 }
            : { borderWidth: 2, borderColor: colors.text3 },
        ]}
      >
        {selected ? <PaywallCheckIcon color={colors.onAccent} /> : null}
      </View>
      <View style={styles.planCopy}>
        <View style={styles.planLabelRow}>
          <Text style={[styles.planLabel, { color: colors.text }]}>{label}</Text>
          {badge ? (
            <Text style={[styles.planBadge, { color: colors.accent }]}>{badge.toUpperCase()}</Text>
          ) : null}
        </View>
        <Text style={[styles.planBilled, { color: colors.text3 }]}>{billed}</Text>
      </View>
      <View style={styles.planPriceWrap}>
        <Text style={[styles.planPrice, { color: colors.text }]}>{price}</Text>
        <Text style={[styles.planPriceSuffix, { color: colors.text3 }]}>/mês</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mist: { opacity: 0.35 },
  screen: { flex: 1, paddingHorizontal: 20 },
  header: { height: 56, justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 8, paddingTop: 18, paddingBottom: 20 },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },
  features: { paddingTop: 20, gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIcon: { width: 22, height: 24, paddingTop: 2 },
  featureCopy: { flex: 1 },
  featureTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 22,
  },
  featureDescription: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 4,
  },
  plans: { gap: 12, paddingTop: 12 },
  planCard: {
    height: 84,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCopy: { flex: 1, minWidth: 0 },
  planLabelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  planLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
  planBadge: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
    lineHeight: 11.5,
    letterSpacing: 1.6,
    marginLeft: 10,
  },
  planBilled: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 13.5,
    marginTop: 7,
  },
  planPriceWrap: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  planPriceSuffix: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13,
  },
  subscribe: { marginHorizontal: 4 },
  renew: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 19,
  },
  legal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13,
  },
  helpHit: { alignItems: 'center', marginTop: 20.5 },
  help: {
    fontFamily: fonts.sansSemi,
    fontSize: 13.5,
    lineHeight: 13.5,
    textAlign: 'center',
  },
});
