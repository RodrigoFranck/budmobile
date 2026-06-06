import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { ViewStyle } from 'react-native';

/** Visible tab bar content area (icons + labels), excluding top padding and home indicator. */
export const TAB_BAR_CONTENT_HEIGHT = 56;
export const TAB_BAR_PADDING_TOP = 8;
export const TAB_BAR_ICON_SIZE = 24;

export function getTabBarHeight(bottomInset: number): number {
  const safeBottom = Math.max(bottomInset, 0);
  return TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP + safeBottom;
}

export function getDefaultTabBarStyle(bottomInset: number): ViewStyle {
  const safeBottom = Math.max(bottomInset, 0);

  return {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    borderTopWidth: 1,
    height: getTabBarHeight(safeBottom),
    paddingTop: TAB_BAR_PADDING_TOP,
    paddingBottom: safeBottom,
  };
}

export function getHiddenTabBarStyle(): ViewStyle {
  return { display: 'none' };
}

export function getMainTabScreenOptions(bottomInset: number): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarShowLabel: true,
    tabBarStyle: getDefaultTabBarStyle(bottomInset),
    tabBarItemStyle: {
      height: TAB_BAR_CONTENT_HEIGHT,
      paddingVertical: 0,
    },
    tabBarIconStyle: {
      marginTop: 2,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      marginTop: 2,
      marginBottom: 0,
    },
    tabBarActiveTintColor: '#ffffff',
    tabBarInactiveTintColor: '#9ca3af',
  };
}
