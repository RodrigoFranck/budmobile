import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Sparkles, Shield } from 'lucide-react-native';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { VoiceOnboardingHero } from '@/components/onboarding/VoiceOnboardingHero';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

const HIGHLIGHTS = [
  {
    Icon: MessageCircle,
    title: 'Fale naturalmente',
    description: 'Conte o que está em sua mente como se estivesse conversando com um amigo.',
  },
  {
    Icon: Sparkles,
    title: 'Respostas em tempo real',
    description: 'O Bud ouve, entende e responde por voz — sem precisar digitar.',
  },
  {
    Icon: Shield,
    title: 'Privado e seguro',
    description: 'Suas conversas por voz são protegidas, assim como no chat por texto.',
  },
];

export default function OnboardingVoiceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const onboardingColors = useOnboardingColors();

  return (
    <LinearGradient
      colors={[onboardingColors.linearTop, onboardingColors.linearBottom]}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 8 }}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <VoiceOnboardingHero />
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 28,
            lineHeight: 36,
            color: onboardingColors.white,
            marginBottom: 12,
          }}
        >
          Converse com o Bud por voz
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: onboardingColors.textSecondary,
            marginBottom: 32,
          }}
        >
          A voz é a forma mais natural de se conectar. Abra uma conversa com o Bud
          e toque no microfone para começar a falar.
        </Text>
        {HIGHLIGHTS.map(({ Icon, title, description }) => (
          <View key={title} className="flex-row" style={{ marginBottom: 24, gap: 16 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: onboardingColors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={22} color={onboardingColors.accent} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: frauncesFont,
                  fontSize: 17,
                  lineHeight: 24,
                  color: onboardingColors.white,
                  marginBottom: 4,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: onboardingColors.textSecondary,
                }}
              >
                {description}
              </Text>
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
          onPress={() => navigation.navigate('OnboardingReady')}
        />
      </View>
    </LinearGradient>
  );
}
