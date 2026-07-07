import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPrimaryButton } from '@/components/onboarding/OnboardingPrimaryButton';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';
import {
  useOnboardingFlow,
  type AgeRangeOption,
} from '@/contexts/OnboardingFlowContext';
import type { OnboardingNavigationProp } from '@/types/onboardingNavigation';

const H_PAD = 24;

const OPTIONS: { key: AgeRangeOption; label: string }[] = [
  { key: 'under-18', label: 'Menor de 18 anos' },
  { key: '18-24', label: '18-24' },
  { key: '25-34', label: '25-34' },
  { key: '35-44', label: '35-44' },
  { key: '45-54', label: '45-54' },
  { key: '55-64', label: '55-64' },
  { key: '65+', label: '65+' },
  { key: 'prefer_not_say', label: 'Prefiro não dizer' },
];

export default function OnboardingAgeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { ageRange, setAgeRange } = useOnboardingFlow();
  const onboardingColors = useOnboardingColors();

  const onContinue = () => {
    navigation.navigate('OnboardingThoughts');
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: onboardingColors.background, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 16 }}>
        <OnboardingBackButton onPress={() => navigation.goBack()} />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 28,
            lineHeight: 36,
            color: onboardingColors.white,
            marginBottom: 28,
          }}
        >
          Qual a sua idade?
        </Text>
        <View style={{ gap: 12 }}>
          {OPTIONS.map((opt) => {
            const selected = ageRange === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setAgeRange(opt.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  backgroundColor: onboardingColors.optionBg,
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  borderWidth: selected ? 1.5 : 0,
                  borderColor: selected ? onboardingColors.accent : 'transparent',
                }}
              >
                <Text style={{ fontSize: 16, color: onboardingColors.white }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
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
          onPress={onContinue}
          disabled={!ageRange}
        />
      </View>
    </View>
  );
}
