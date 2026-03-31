import { TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useOnboardingColors } from '@/constants/onboardingTheme';

interface OnboardingBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function OnboardingBackButton({
  onPress,
  accessibilityLabel = 'Voltar',
}: OnboardingBackButtonProps) {
  const onboardingColors = useOnboardingColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      activeOpacity={0.7}
    >
      <ChevronLeft size={22} color={onboardingColors.white} strokeWidth={2} />
    </TouchableOpacity>
  );
}
