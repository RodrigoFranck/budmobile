import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { AccentTitle } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

export default function AccountDeletedScreen({
  name,
  onClose,
}: {
  name: string | null;
  onClose: () => void;
}) {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image
        source={assets.accountDeletedMist}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.5 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 96 }}>
        <Image source={assets.accountDeletedGiz} style={{ width: 250, height: 330 }} resizeMode="contain" />
        <View style={{ marginTop: 40, paddingHorizontal: 24 }}>
          <AccentTitle before="Sua conta foi " accent="excluída" align="center" />
        </View>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 16,
            lineHeight: 25,
            color: colors.text2,
            textAlign: 'center',
            marginTop: 60,
            paddingHorizontal: 44,
          }}
        >
          Foi bom ter você por aqui{name ? `, ${name}` : ''}. Se um dia quiser voltar, o Bud vai estar aqui.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <BudButton label="Fechar" onPress={onClose} />
      </View>
    </View>
  );
}
