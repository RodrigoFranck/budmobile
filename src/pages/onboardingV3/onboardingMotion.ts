import { Easing } from 'react-native-reanimated';

export const onboardingMotion = {
  optionMs: 250,
  nextMs: 350,
  backMs: 300,
  moodMs: 450,
  moodRotatePerStop: 24,
  sheetMs: 300,
  fadeExitMs: 450,
  loadingEnterMs: 520,
  loadingPhraseMs: 280,
  loadingRevealMs: 720,
  toggleMs: 200,
  reducedMs: 200,
  scrim: 0.55,
} as const;

export const onboardingEasing = {
  quick: Easing.bezier(0.2, 0, 0, 1),
  standard: Easing.bezier(0.42, 0, 0.58, 1),
  gentle: Easing.bezier(0.22, 1, 0.36, 1),
  enter: Easing.bezier(0, 0, 0.58, 1),
  exit: Easing.bezier(0.42, 0, 1, 1),
} as const;
