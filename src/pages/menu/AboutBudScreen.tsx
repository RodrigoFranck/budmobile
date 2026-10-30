import { Image, Linking, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ExternalLink, FileText, Heart, Shield } from 'lucide-react-native';

import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/healthSafety';
import { APP_VERSION } from '@/pages/menu/menuCatalog';
import { MenuHeader, PrefGroup, PrefRow, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

export default function AboutBudScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation();

  return (
    <ScreenScaffold>
      <MenuHeader title="Sobre o Bud" onBack={() => navigation.goBack()} />
      <View style={{ alignItems: 'center', marginTop: 26 }}>
        <Image source={assets.wordmark} style={{ width: 140, height: 70 }} resizeMode="contain" />
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontStyle: 'italic',
            fontSize: 18,
            letterSpacing: -0.4,
            color: colors.text2,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Inteligência artificial para saúde mental
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 13,
            color: colors.text3,
            marginTop: 12,
          }}
        >
          Versão {APP_VERSION}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text2,
          marginTop: 32,
          paddingHorizontal: 4,
        }}
      >
        O Bud é um companheiro para cuidar da sua saúde mental todos os dias. Ele escuta, pergunta e te ajuda a
        enxergar o que está acontecendo, no seu ritmo.
      </Text>
      <PrefGroup style={{ marginTop: 22 }}>
        <PrefRow
          icon={FileText}
          label="Termos de uso"
          trailing={<ExternalLink color={colors.text3} size={18} />}
          onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}
        />
        <PrefRow
          icon={Shield}
          label="Política de privacidade"
          last
          trailing={<ExternalLink color={colors.text3} size={18} />}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        />
      </PrefGroup>
      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.surface,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 18,
          flexDirection: 'row',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <Heart color={colors.accent} size={22} />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 21,
            color: colors.text2,
          }}
        >
          O Bud não substitui psicólogo nem atendimento de emergência. Em perigo, ligue 188 (CVV) ou 192 (SAMU).
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          lineHeight: 13,
          color: colors.text3,
          textAlign: 'center',
          marginTop: 80,
        }}
      >
        Feito com cuidado em São Paulo
      </Text>
    </ScreenScaffold>
  );
}
