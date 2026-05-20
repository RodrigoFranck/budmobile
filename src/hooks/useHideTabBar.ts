import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDefaultTabBarStyle } from '@/constants/tabBar';

export function useHideTabBar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    const tabNav = navigation.getParent();
    if (!tabNav) return;

    tabNav.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      tabNav.setOptions({
        tabBarStyle: getDefaultTabBarStyle(insets.bottom),
      });
    };
  }, [navigation, insets.bottom]);
}
