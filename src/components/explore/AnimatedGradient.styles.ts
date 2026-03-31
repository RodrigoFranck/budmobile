import { StyleSheet } from 'react-native';

export const animatedGradientStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    flex: 1,
    zIndex: 1,
  },
});

