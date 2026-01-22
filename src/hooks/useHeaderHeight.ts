import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to calculate the header height including safe area insets
 * Header height = safe area top + 44px (py-3 = 12px top + 12px bottom + 20px text)
 */
export function useHeaderHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + 44;
}

