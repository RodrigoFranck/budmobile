import { Text, TouchableOpacity } from 'react-native';

import { fonts, useV3Colors } from '@/theme';

interface BudChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function BudChip({ label, selected, onPress }: BudChipProps) {
  const colors = useV3Colors();
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
        backgroundColor: selected ? colors.btn : colors.surface2,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          color: selected ? colors.onBtn : colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
