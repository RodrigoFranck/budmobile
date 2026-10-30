import { ActivityIndicator, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { fonts, useV3Colors, type V3Colors } from '@/theme';

export type BudButtonVariant = 'primary' | 'accent' | 'soft' | 'outline' | 'disabled';

interface BudButtonProps {
  label: string;
  onPress: () => void;
  variant?: BudButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: LucideIcon;
}

function palette(colors: V3Colors, variant: BudButtonVariant) {
  if (variant === 'accent') {
    return { bg: colors.accent, fg: colors.onAccent, opacity: 1, border: 'transparent' };
  }
  if (variant === 'soft') {
    return { bg: colors.surface2, fg: colors.text, opacity: 1, border: 'transparent' };
  }
  if (variant === 'outline') {
    return { bg: 'transparent', fg: colors.accent, opacity: 1, border: colors.line };
  }
  if (variant === 'disabled') {
    return { bg: colors.surface2, fg: colors.text3, opacity: 1, border: 'transparent' };
  }
  return { bg: colors.btn, fg: colors.onBtn, opacity: 1, border: 'transparent' };
}

export function BudButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon: Icon,
}: BudButtonProps) {
  const colors = useV3Colors();
  const isDisabled = Boolean(disabled || loading || variant === 'disabled');
  const tone = palette(colors, isDisabled && variant !== 'disabled' ? 'disabled' : variant);
  const labelStyle = {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 22,
    color: tone.fg,
  } as const;

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
          borderWidth: tone.border === 'transparent' ? 0 : 1,
          borderColor: tone.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : Icon ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon color={tone.fg} size={20} />
          <Text style={labelStyle}>{label}</Text>
        </View>
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
