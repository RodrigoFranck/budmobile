import { Text, TouchableOpacity } from 'react-native';

import { fonts, useV3Colors } from '@/theme';

interface BudChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  selectedTone?: 'btn' | 'accent';
  selectedColor?: string;
  selectedLabelColor?: string;
}

export function BudChip({
  label,
  selected,
  onPress,
  selectedTone = 'btn',
  selectedColor,
  selectedLabelColor,
}: BudChipProps) {
  const colors = useV3Colors();
  const selectedBg = selectedColor ?? (selectedTone === 'accent' ? colors.accent : colors.btn);
  const selectedFg = selectedLabelColor ?? (selectedTone === 'accent' ? colors.onAccent : colors.onBtn);
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={{
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? selectedBg : colors.surface2,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          lineHeight: 15,
          color: selected ? selectedFg : colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
