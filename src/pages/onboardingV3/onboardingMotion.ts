import { Easing } from 'react-native-reanimated';

export const onboardingMotion = {
  optionMs: 250,
  nextMs: 400,
  backMs: 350,
  moodMs: 450,
  moodRotatePerStop: 24,
  sheetMs: 300,
  fadeExitMs: 450,
  loadingEnterMs: 520,
  loadingPhraseMs: 280,
  loadingRevealMs: 720,
  scrim: 0.55,
} as const;

export const onboardingEasing = {
  quick: Easing.bezier(0.25, 0, 0, 1),
  standard: Easing.bezier(0.42, 0, 0.58, 1),
  gentle: Easing.bezier(0.45, 0, 0.55, 1),
} as const;
