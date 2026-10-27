import { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton, BudChip } from '@/components/v3';
import { useUserPlan } from '@/hooks/useUserPlan';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';

type PaywallRoute = RouteProp<MainTabParamList, 'Paywall'>;

export default function PaywallScreen() {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PaywallRoute>();
  const [interval, setInterval] = useState<'monthly' | 'annual'>(route.params?.interval ?? 'annual');
  const { startCheckout } = useUserPlan();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + 24,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.text }}>
        Continue conversando com o Bud
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.text2, marginTop: 16 }}>
        Sua última conversa continua visível. Para enviar novas mensagens, escolha um plano.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
        <BudChip label="Anual" selected={interval === 'annual'} onPress={() => setInterval('annual')} />
        <BudChip label="Mensal" selected={interval === 'monthly'} onPress={() => setInterval('monthly')} />
      </View>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.text3, marginTop: 16 }}>
        Cobrança real (App Store / Stripe) entra na próxima etapa. Por agora o plano é registrado na conta.
      </Text>
      <View style={{ flex: 1 }} />
      <BudButton
        label={interval === 'monthly' ? 'Assinar mensal' : 'Assinar anual'}
        onPress={() => {
          void startCheckout(interval);
          navigation.goBack();
        }}
      />
      <BudButton label="Agora não" variant="soft" onPress={() => navigation.goBack()} style={{ marginTop: 12 }} />
    </View>
  );
}
