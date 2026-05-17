import type { ViewStyle } from 'react-native';

export function getDefaultTabBarStyle(bottomInset: number): ViewStyle {
  return {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    borderTopWidth: 1,
    height: 64 + Math.max(bottomInset, 0),
    paddingBottom: Math.max(bottomInset, 0),
    paddingTop: 8,
    display: 'flex',
  };
}
