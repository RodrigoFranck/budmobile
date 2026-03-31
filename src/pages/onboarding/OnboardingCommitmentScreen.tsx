import { View, Text, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

const BULLETS = [
  'Você permanecerá anônimo.',
  'Suas conversas serão usadas para tornar o Bud melhor para todos.',
  'Seus dados de conversa serão usados para rastrear bugs e melhorar a forma como o Bud se comunica.',
];

export default function OnboardingCommitmentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { displayName, shareConversations, setShareConversations } = useOnboardingFlow();
  const onboardingColors = useOnboardingColors();
  const firstName = displayName.trim().split(/\s+/)[0] || 'Você';

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: onboardingColors.background, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 8 }}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24 }}
      >
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 24,
            lineHeight: 32,
            color: onboardingColors.white,
            marginBottom: 10,
          }}
        >
          {firstName}, esse é o nosso compromisso com você!
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: onboardingColors.textSecondary,
            marginBottom: 28,
          }}
        >
          Sua saúde mental é pessoal e privada
        </Text>

        <View
          style={{
            backgroundColor: onboardingColors.card,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <View className="flex-row items-start justify-between gap-3" style={{ marginBottom: 20 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                lineHeight: 22,
                color: onboardingColors.white,
              }}
            >
              Nos ajude a melhorar sua experiência compartilhando suas conversas
            </Text>
            <Switch
              value={shareConversations}
              onValueChange={setShareConversations}
              trackColor={{ false: '#767577', true: onboardingColors.accentAlt }}
              thumbColor={onboardingColors.white}
              accessibilityLabel="Compartilhar conversas para melhorar o Bud"
            />
          </View>
          {BULLETS.map((line) => (
            <View key={line} className="flex-row gap-3" style={{ marginBottom: 14 }}>
              <View
                style={{
                  marginTop: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 1,
                  borderColor: onboardingColors.grayMedium,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={12} color={onboardingColors.textSecondary} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: onboardingColors.textSecondary }}>
                {line}
              </Text>
            </View>
          ))}
        </View>
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
          onPress={() => navigation.navigate('OnboardingNotifications')}
        />
      </View>
    </View>
  );
}
