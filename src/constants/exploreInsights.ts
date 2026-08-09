export const EXPLORE_INSIGHT_KEYS = [
  'yesterday_journey',
  'frequency',
  'habit',
] as const;

export type ExploreInsightKey = (typeof EXPLORE_INSIGHT_KEYS)[number];

export const EXPLORE_INSIGHT_COUNT = EXPLORE_INSIGHT_KEYS.length;

type GradientPair = {
  base: readonly [string, string, string];
  animated: readonly [string, string, string];
};

type InsightGradientTheme = {
  screen: {
    dark: GradientPair;
    light: GradientPair;
  };
};

/**
 * Screen background gradients per explore insight.
 * Habit uses Bud's mint/teal theme accent.
 */
export const ExploreInsightGradients: Record<ExploreInsightKey, InsightGradientTheme> = {
  yesterday_journey: {
    screen: {
      dark: {
        base: ['#1D1916', '#2A2210', '#E0C35A'],
        animated: ['#1D1916', '#332910', '#E8D06A'],
      },
      light: {
        base: ['#F7F1ED', '#F3E8C8', '#E8C96A'],
        animated: ['#F7F1ED', '#F0E0B0', '#E0C35A'],
      },
    },
  },
  frequency: {
    screen: {
      dark: {
        base: ['#1D1916', '#151C24', '#6B9BD1'],
        animated: ['#1D1916', '#1A2430', '#7AABDF'],
      },
      light: {
        base: ['#F7F1ED', '#D8E6F4', '#6B9BD1'],
        animated: ['#F7F1ED', '#C5DBF0', '#5B8FBF'],
      },
    },
  },
  habit: {
    screen: {
      dark: {
        base: ['#1D1916', '#1C1917', '#B8EBEB'],
        animated: ['#1D1916', '#1A1816', '#BBEEEE'],
      },
      light: {
        base: ['#F7F1ED', '#F3E7E0', '#DDEEEE'],
        animated: ['#F7F1ED', '#EFE3DC', '#CFEDED'],
      },
    },
  },
};

export const EXPLORE_GRADIENT_ANIMATION_MS = 4000;
