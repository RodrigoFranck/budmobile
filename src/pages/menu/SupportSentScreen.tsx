import { Image, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { BUD_SUPPORT_EMAIL } from '@/constants/preferences';
import { AccentTitle } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

export default function SupportSentScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 136 }}>
        <Image source={assets.supportSent} style={{ width: 180, height: 200 }} resizeMode="contain" />
        <View style={{ marginTop: 40, paddingHorizontal: 30 }}>
          <AccentTitle before="Recebemos sua " accent="mensagem" align="center" />
        </View>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 16,
            lineHeight: 25,
            color: colors.text2,
            textAlign: 'center',
            marginTop: 20,
            paddingHorizontal: 40,
          }}
        >
          Ela chegou em {BUD_SUPPORT_EMAIL}. A gente responde no seu e-mail em até 2 dias úteis.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <BudButton
          label="Voltar para o início"
          onPress={() =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              }),
            )
          }
        />
      </View>
    </View>
  );
}
