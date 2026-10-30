import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/healthSafety';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PaywallOfferCard, type PaywallInterval } from '@/pages/paywall/PaywallOfferCard';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';

type PaywallRoute = RouteProp<MainTabParamList, 'Paywall'>;

export default function PaywallScreen() {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PaywallRoute>();
  const { showAlert } = useAppAlert();
  const { startCheckout, restorePurchases } = useUserPlan();
  const [interval, setInterval] = useState<PaywallInterval>(route.params?.interval ?? 'annual');
  const [submitting, setSubmitting] = useState(false);
  const annual = interval === 'annual';

  const dismiss = () => navigation.goBack();

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      await startCheckout(interval);
      dismiss();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      dismiss();
      return;
    }
    showAlert({
      title: 'Nenhuma compra para restaurar',
      message: 'Quando a cobrança estiver ativa, suas compras da loja voltam para esta conta por aqui.',
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 4, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.header}>
          <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={dismiss} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.titleBlock}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumScaleFactor={0.85}
              style={[styles.title, { color: colors.text }]}
            >
              {'Siga com o Bud '}
              <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: colors.accent }}>
                Premium
              </Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              Conversas sem limite, uma memória que acompanha você, o modo de voz e acesso ilimitado às atividades do app.
            </Text>
          </View>

          <View style={styles.topSpacer} />

          <PaywallOfferCard interval={interval} onChangeInterval={setInterval} />

          <View style={styles.bottomSpacer} />

          <View style={styles.footer}>
            <Text style={[styles.renew, { color: colors.text2 }]}>
              {'Renova em '}
              <Text style={{ fontFamily: fonts.sansSemi, color: colors.text }}>
                {annual ? 'R$ 999,90 por ano' : 'R$ 129,90 por mês'}
              </Text>
              {' · cancele quando quiser'}
            </Text>

            <BudButton
              label="Assinar o Bud Premium"
              loading={submitting}
              onPress={() => void handleSubscribe()}
            />

            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Agora não"
              style={styles.skipHit}
            >
              <Text style={[styles.skipText, { color: colors.text }]}>Agora não</Text>
            </Pressable>

            <View style={styles.legalRow}>
              <Pressable onPress={() => void handleRestore()} accessibilityRole="button">
                <Text style={[styles.legal, { color: colors.text3 }]}>Restaurar compra</Text>
              </Pressable>
              <Text style={[styles.legal, { color: colors.text3 }]}> · </Text>
              <Pressable onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)} accessibilityRole="link">
                <Text style={[styles.legal, { color: colors.text3 }]}>Termos</Text>
              </Pressable>
              <Text style={[styles.legal, { color: colors.text3 }]}> · </Text>
              <Pressable onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
                <Text style={[styles.legal, { color: colors.text3 }]}>Privacidade</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  titleBlock: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },
  topSpacer: { flex: 90, minHeight: 24 },
  bottomSpacer: { flex: 67, minHeight: 20 },
  footer: {
    paddingHorizontal: 24,
  },
  renew: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  skipHit: {
    alignItems: 'center',
    paddingTop: 26,
  },
  skipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 16,
    lineHeight: 16,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 23,
  },
  legal: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13,
  },
});
