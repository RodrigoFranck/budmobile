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
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

export default function OnboardingNameScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { displayName, setDisplayName } = useOnboardingFlow();
  const [localName, setLocalName] = useState(displayName);
  const onboardingColors = useOnboardingColors();

  const canContinue = localName.trim().length > 0;

  const onContinue = () => {
    setDisplayName(localName.trim());
    navigation.navigate('OnboardingAge');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ backgroundColor: onboardingColors.backgroundAlt, paddingTop: insets.top }}
      >
        <View className="flex-1" style={{ paddingHorizontal: H_PAD }}>
          <View className="flex-1 justify-center" style={{ paddingBottom: 120 }}>
            <Text
              style={{
                fontFamily: frauncesFont,
                fontSize: 28,
                lineHeight: 36,
                color: onboardingColors.white,
                marginBottom: 20,
              }}
            >
              Como devemos te chamar?
            </Text>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: onboardingColors.grayMedium,
                paddingBottom: 8,
              }}
            >
              <TextInput
                value={localName}
                onChangeText={setLocalName}
                placeholder="Escreva aqui seu nome ou apelido"
                placeholderTextColor={onboardingColors.textMuted}
                style={{
                  fontSize: 16,
                  color: onboardingColors.white,
                  paddingVertical: 8,
                }}
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Nome ou apelido"
              />
            </View>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: H_PAD,
            paddingBottom: Math.max(insets.bottom, 20),
            paddingTop: 12,
          }}
        >
          <OnboardingPrimaryButton
            label="Continuar"
            onPress={onContinue}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
