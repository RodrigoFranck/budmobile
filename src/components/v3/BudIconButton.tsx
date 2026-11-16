import { TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useV3Colors } from '@/theme';

interface BudIconButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  tone?: 'surface' | 'scrim';
  disabled?: boolean;
}

export function BudIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  tone = 'surface',
  disabled = false,
}: BudIconButtonProps) {
  const colors = useV3Colors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'scrim' ? colors.scrim : colors.surface2,
        opacity: disabled ? 0.4 : tone === 'scrim' ? 0.85 : 1,
      }}
    >
      <Icon color={colors.text} size={22} />
    </TouchableOpacity>
  );
}
