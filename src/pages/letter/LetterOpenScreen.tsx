import { ImageBackground, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

export default function LetterOpenScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { letter } = useDailyLetter();

  return (
    <ImageBackground
      source={assets.envelopePaper}
      style={{ flex: 1, backgroundColor: colors.bg }}
      imageStyle={{ opacity: 0.28 }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={() => navigation.navigate('Home')} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }}>
          <Text
            style={{
              fontFamily: fonts.sansSemi,
              fontSize: 11.5,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: colors.text3,
              marginTop: 24,
            }}
          >
            Carta de hoje
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              color: colors.text,
              marginTop: 16,
            }}
          >
            {letter?.title ?? 'Você não precisa resolver tudo hoje'}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 17,
              lineHeight: 26,
              color: colors.text2,
              marginTop: 20,
            }}
          >
            {letter?.body}
          </Text>
          <BudButton
            label="Conversar sobre isso"
            onPress={() =>
              navigateToChatTab(navigation, {
                chatInsight: {
                  insightType: 'yesterday_journey',
                  title: letter?.title ?? 'Carta de hoje',
                  contextSummary: letter?.body ?? '',
                  internalContext: letter?.body ?? '',
                  cardDescription: letter?.body ?? '',
                  backgroundType: 'yesterday',
                },
              })
            }
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
