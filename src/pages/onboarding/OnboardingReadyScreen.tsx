import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Compass, BookOpen } from 'lucide-react-native';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

const FEATURES = [
  {
    Icon: MessageCircle,
    title: 'Tenha uma conversa real',
    description: 'Fale naturalmente sobre o que estiver em sua mente.',
  },
  {
    Icon: Compass,
    title: 'Deixe o Bud fazer sua mágica',
    description: 'O Bud vai te guiar com base no que você está buscando alcançar.',
  },
  {
    Icon: BookOpen,
    title: 'Veja seu histórico',
    description: 'Disponível sempre que precisar.',
  },
];

export default function OnboardingReadyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { completeOnboarding, submitting } = useOnboardingComplete();
  const onboardingColors = useOnboardingColors();

  const onFinish = async () => {
    const { error } = await completeOnboarding();
    if (error) {
      return;
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: onboardingColors.backgroundAlt, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 8 }}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 30,
            lineHeight: 38,
            color: onboardingColors.white,
            marginBottom: 36,
          }}
        >
          Está tudo pronto!
        </Text>
        {FEATURES.map(({ Icon, title, description }) => (
          <View key={title} className="flex-row" style={{ marginBottom: 28, gap: 16 }}>
            <Icon size={28} color={onboardingColors.white} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: frauncesFont,
                  fontSize: 18,
                  lineHeight: 24,
                  color: onboardingColors.white,
                  marginBottom: 6,
                }}
              >
                {title}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color: '#8E8E8E' }}>{description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: H_PAD,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 12,
        }}
      >
        <OnboardingPrimaryButton
          label="Continuar"
          onPress={onFinish}
          loading={submitting}
          disabled={submitting}
        />
      </View>
    </View>
  );
}
