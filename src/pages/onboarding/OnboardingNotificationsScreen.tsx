import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

const CARDS = [
  {
    title: 'Oi, Bud aqui!',
    body: 'Como foi aquela reunião que conversamos ontem?',
  },
  {
    title: 'Hey!',
    body: 'Sei que geralmente esse horário costuma ser difícil para você. Se quiser conversar, estou aqui.',
  },
  {
    title: 'Tenho uma surpresa...',
    body: 'Seus insights da semana ficaram prontos. Vem conferir!',
  },
];

function NotificationCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const onboardingColors = useOnboardingColors();
  return (
    <View
      style={{
        backgroundColor: onboardingColors.card,
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: '#A8D8EA',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontFamily: frauncesFont, fontSize: 11, color: '#1D1916' }}>
          Bud.
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View className="flex-row justify-between items-start">
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: onboardingColors.white,
              flex: 1,
              paddingRight: 8,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: onboardingColors.textMuted }}>Agora</Text>
        </View>
        <Text style={{ fontSize: 14, color: onboardingColors.textSecondary, marginTop: 4, lineHeight: 20 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const onboardingColors = useOnboardingColors();
  const { setNotificationsEnabled } = useNotificationPreferences();
  const [activating, setActivating] = useState(false);

  const goToVoice = () => navigation.navigate('OnboardingVoice');

  const onActivate = async () => {
    setActivating(true);
    try {
      await setNotificationsEnabled(true);
    } finally {
      setActivating(false);
      goToVoice();
    }
  };

  const onSkip = async () => {
    try {
      await setNotificationsEnabled(false);
    } finally {
      goToVoice();
    }
  };

  return (
    <LinearGradient
      colors={[onboardingColors.linearTop, onboardingColors.linearBottom]}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 16 }}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 28,
            lineHeight: 36,
            color: onboardingColors.white,
            marginBottom: 12,
          }}
        >
          Nunca perca um insight!
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: onboardingColors.textSecondary,
            marginBottom: 28,
          }}
        >
          Receba mensagens que se baseiam em suas conversas e promovem seu crescimento.
        </Text>
        {CARDS.map((c) => (
          <NotificationCard key={c.title} title={c.title} body={c.body} />
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
          label={activating ? 'Ativando...' : 'Ativar notificações'}
          onPress={onActivate}
          disabled={activating}
        />
        <View style={{ height: 12 }} />
        <OnboardingPrimaryButton label="Continuar" onPress={onSkip} />
      </View>
    </LinearGradient>
  );
}
