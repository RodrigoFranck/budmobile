import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_SCREEN_HEADER } from '@/components/ui/TabScreenHeader.styles';

export function useHeaderHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + TAB_SCREEN_HEADER.contentTopPadding + TAB_SCREEN_HEADER.contentHeight;
}
