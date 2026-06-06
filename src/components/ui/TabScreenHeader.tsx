import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createTabScreenHeaderStyles,
  TAB_SCREEN_HEADER,
} from '@/components/ui/TabScreenHeader.styles';

interface TabScreenHeaderProps {
  children: ReactNode;
}

export function TabScreenHeader({ children }: TabScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createTabScreenHeaderStyles(), []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + TAB_SCREEN_HEADER.contentTopPadding,
          paddingHorizontal: TAB_SCREEN_HEADER.horizontalPadding,
        },
      ]}
    >
      {children}
    </View>
  );
}

export { TAB_SCREEN_HEADER };
