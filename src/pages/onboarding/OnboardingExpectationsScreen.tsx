import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

export default function OnboardingExpectationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { conversationGoal, setConversationGoal } = useOnboardingFlow();
  const [text, setText] = useState(conversationGoal);
  const onboardingColors = useOnboardingColors();

  const onContinue = () => {
    setConversationGoal(text.trim());
    navigation.navigate('OnboardingCommitment');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ backgroundColor: onboardingColors.background, paddingTop: insets.top }}
      >
        <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 8 }}>
          <OnboardingBackButton onPress={() => navigation.goBack()} />
        </View>
        <View className="flex-1 px-6" style={{ paddingHorizontal: H_PAD }}>
          <Text
            style={{
              fontFamily: frauncesFont,
              fontSize: 26,
              lineHeight: 34,
              color: onboardingColors.white,
              marginBottom: 12,
            }}
          >
            O que você espera do Bud?
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: onboardingColors.textSecondary,
              marginBottom: 20,
            }}
          >
            Essa informação vai ajudar o Bud a se adaptar ao que você precisa, seja compartilhar
            habilidades, ajudar você a pensar sobre as coisas de uma nova forma, ou simplesmente
            ouvir.
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Quero me sentir..."
            placeholderTextColor={onboardingColors.textMuted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 200,
              backgroundColor: onboardingColors.inputSurface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: onboardingColors.borderDark,
              padding: 16,
              fontSize: 16,
              color: onboardingColors.white,
            }}
            accessibilityLabel="Expectativas em relação ao Bud"
          />
        </View>
        <View
          style={{
            paddingHorizontal: H_PAD,
            paddingBottom: Math.max(insets.bottom, 20),
            paddingTop: 12,
          }}
        >
          <OnboardingPrimaryButton label="Continuar" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
