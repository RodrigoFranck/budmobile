import { TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useV3Colors } from '@/theme';

interface BudIconButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  tone?: 'surface' | 'scrim';
}

export function BudIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  tone = 'surface',
}: BudIconButtonProps) {
  const colors = useV3Colors();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'scrim' ? colors.scrim : colors.surface2,
        opacity: tone === 'scrim' ? 0.85 : 1,
      }}
    >
      <Icon color={colors.text} size={22} />
    </TouchableOpacity>
  );
}
