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
import { navigateToChatTab, takePendingChatInsight } from '@/utils/navigateToChat';
import { discardPendingContextualChat } from '@/utils/openContextualChatOrPaywall';

type PaywallRoute = RouteProp<MainTabParamList, 'Paywall'>;

export default function PaywallScreen() {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PaywallRoute>();
  const { showAlert } = useAppAlert();
  const {
    startCheckout,
    restorePurchases,
    prices,
    productsReady,
    productsLoading,
    productsError,
    refreshStoreCatalog,
  } = useUserPlan();
  const [interval, setInterval] = useState<PaywallInterval>(route.params?.interval ?? 'monthly');
  const [submitting, setSubmitting] = useState(false);
  const annual = interval === 'annual';
  const resumePending = Boolean(route.params?.resumePendingChatInsight);
  const canSubscribe = productsReady && !productsLoading;

  const dismiss = () => {
    if (resumePending) discardPendingContextualChat();
    navigation.goBack();
  };

  const afterUnlock = () => {
    if (resumePending) {
      const insight = takePendingChatInsight();
      navigateToChatTab(navigation, insight ? { chatInsight: insight } : {});
      return;
    }
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    if (!canSubscribe) {
      showAlert({
        title: 'Planos indisponíveis',
        message:
          productsError ??
          'Aguarde os planos carregarem da loja antes de assinar.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const purchased = await startCheckout(interval);
      if (purchased) afterUnlock();
    } catch (error) {
      showAlert({
        title: 'Não foi possível assinar',
        message: error instanceof Error ? error.message : 'Tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        afterUnlock();
        return;
      }
      showAlert({
        title: 'Nenhuma compra para restaurar',
        message: 'Quando a assinatura estiver ativa na loja, ela volta para esta conta por aqui.',
      });
    } catch (error) {
      showAlert({
        title: 'Não foi possível restaurar',
        message: error instanceof Error ? error.message : 'Tente novamente.',
      });
    }
  };

  const subscribeLabel = productsLoading
    ? 'Carregando planos…'
    : productsReady
      ? 'Assinar o Bud Premium'
      : 'Planos indisponíveis';

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
              Conversas sem limite, uma memória que acompanha você e o modo de voz.
            </Text>
          </View>

          <View style={styles.topSpacer} />

          <PaywallOfferCard interval={interval} onChangeInterval={setInterval} prices={prices} />

          <View style={styles.bottomSpacer} />

          <View style={styles.footer}>
            <Text style={[styles.renew, { color: colors.text2 }]}>
              {annual
                ? `Renova em ${prices.annualTotal} por ano · cancele quando quiser`
                : `Renova em ${prices.monthly} por mês · cancele quando quiser`}
            </Text>

            {!productsReady && !productsLoading && productsError ? (
              <Text style={[styles.storeHint, { color: colors.text3 }]}>{productsError}</Text>
            ) : null}

            <BudButton
              label={subscribeLabel}
              loading={submitting || productsLoading}
              disabled={!canSubscribe}
              onPress={() => void handleSubscribe()}
            />

            {!productsReady && !productsLoading ? (
              <Pressable
                onPress={() => void refreshStoreCatalog()}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar planos de novo"
                style={styles.retryHit}
              >
                <Text style={[styles.retryText, { color: colors.accent }]}>Tentar de novo</Text>
              </Pressable>
            ) : null}

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
  storeHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryHit: {
    alignItems: 'center',
    paddingTop: 14,
  },
  retryText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    lineHeight: 18,
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
