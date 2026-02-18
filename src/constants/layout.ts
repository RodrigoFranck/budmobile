import { Dimensions, Platform } from 'react-native';

/**
 * Screen dimensions
 */
export const SCREEN = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
} as const;

/**
 * Platform-specific constants
 */
export const PlatformConstants = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  keyboardBehavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 0,
} as const;

/**
 * Layout spacing
 */
export const LayoutSpacing = {
  // Horizontal padding
  horizontalPadding: SCREEN.width * 0.08, // 8% of screen width
  horizontalPaddingSmall: 16,
  
  // Vertical padding
  verticalPadding: {
    ios: 40,
    android: 30,
  },
  verticalPaddingSmall: {
    ios: 60,
    android: 40,
  },
  
  // Content padding
  contentPadding: {
    top: 24,
    horizontal: 16,
    bottom: 24,
  },
  
  // Auth screen specific
  authPadding: {
    horizontal: SCREEN.width * 0.08,
    vertical: {
      ios: 40,
      android: 30,
    },
    verticalSmall: {
      ios: 60,
      android: 40,
    },
  },
} as const;

/**
 * Screen size breakpoints
 */
export const ScreenBreakpoints = {
  small: 700,
} as const;

/**
 * Header constants
 */
export const HeaderConstants = {
  height: 44, // Base header height
  paddingTop: 12,
  paddingBottom: 12,
  paddingHorizontal: 16,
} as const;

/**
 * Sidebar constants
 */
export const SidebarConstants = {
  width: 280,
  slideDuration: 300,
  overlayOpacity: 0.5,
} as const;

/**
 * Chat constants
 */
export const ChatConstants = {
  inputBarHeight: 76, // paddingTop (16) + input (44) + paddingBottom (16)
  inputMinHeight: 44,
  inputMaxHeight: 120,
  messagePadding: 16,
} as const;

/**
 * Explore gradient colors
 */
export const ExploreGradientColors = {
  base: ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e', '#16213e'],
  animated: ['#16213e', '#0f3460', '#1a1a2e', '#16213e', '#0f3460'],
  animationDuration: 4000,
} as const;

