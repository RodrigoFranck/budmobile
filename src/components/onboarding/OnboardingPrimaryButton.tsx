import { ActivityIndicator, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { frauncesFont, useOnboardingColors } from '@/constants/onboardingTheme';

interface OnboardingPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelColor?: string;
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  labelColor,
}: OnboardingPrimaryButtonProps) {
  const onboardingColors = useOnboardingColors();
  const isDisabled = Boolean(disabled || loading);
  const resolvedLabelColor = labelColor ?? onboardingColors.textOnAccent;
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
        <ActivityIndicator color={resolvedLabelColor} />
      ) : (
        <Text
          style={{
            fontFamily: frauncesFont,
            fontSize: 17,
            color: resolvedLabelColor,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
