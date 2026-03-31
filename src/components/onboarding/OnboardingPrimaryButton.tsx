import { ActivityIndicator, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';

interface OnboardingPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}: OnboardingPrimaryButtonProps) {
  const onboardingColors = useOnboardingColors();
  const isDisabled = Boolean(disabled || loading);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className="w-full items-center justify-center py-4"
      style={[
        {
          backgroundColor: onboardingColors.accent,
          borderRadius: 14,
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={onboardingColors.background} />
      ) : (
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 17,
            color: onboardingColors.background,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
