import { ActivityIndicator, Text, TouchableOpacity, type ViewStyle } from 'react-native';

import { fonts, useV3Colors, type V3Colors } from '@/theme';

export type BudButtonVariant = 'primary' | 'accent' | 'soft' | 'disabled';

interface BudButtonProps {
  label: string;
  onPress: () => void;
  variant?: BudButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

function palette(colors: V3Colors, variant: BudButtonVariant) {
  if (variant === 'accent') {
    return { bg: colors.accent, fg: colors.onAccent, opacity: 1 };
  }
  if (variant === 'soft') {
    return { bg: colors.surface2, fg: colors.text, opacity: 1 };
  }
  if (variant === 'disabled') {
    return { bg: colors.surface2, fg: colors.text3, opacity: 0.55 };
  }
  return { bg: colors.btn, fg: colors.onBtn, opacity: 1 };
}

export function BudButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: BudButtonProps) {
  const colors = useV3Colors();
  const isDisabled = Boolean(disabled || loading || variant === 'disabled');
  const tone = palette(colors, isDisabled && variant !== 'disabled' ? 'disabled' : variant);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        {
          height: 58,
          borderRadius: 29,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.bg,
          opacity: tone.opacity,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <Text
          style={{
            fontFamily: fonts.sansSemi,
            fontSize: 17,
            lineHeight: 17,
            color: tone.fg,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
