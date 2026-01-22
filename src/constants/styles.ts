/**
 * Typography constants
 */
export const Typography = {
  // Font sizes
  xs: 10,
  sm: 12,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,

  // Line heights
  lineHeight: {
    tight: 20,
    normal: 22,
    relaxed: 24,
  },
} as const;

/**
 * Spacing constants
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

/**
 * Border radius constants
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

/**
 * Icon sizes
 */
export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/**
 * Input heights
 */
export const InputHeight = {
  sm: 40,
  md: 44,
  lg: 52,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const AnimationDuration = {
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 800,
  slowest: 4000,
} as const;

/**
 * Z-index layers
 */
export const ZIndex = {
  base: 1,
  dropdown: 10,
  overlay: 40,
  sidebar: 50,
  header: 30,
  modal: 100,
} as const;

