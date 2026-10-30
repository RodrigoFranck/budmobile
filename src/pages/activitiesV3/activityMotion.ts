import { Easing } from 'react-native-reanimated';

import { motion } from '@/theme';

export const activityMotion = {
  puckSettleMs: motion.questionStepMs,
  nextMs: motion.nextQuestionMs,
  backMs: motion.previousQuestionMs,
  reorderMs: motion.reorderMs,
  puckScale: 1.12,
  puckInertiaPx: 10,
  labelBandPx: 24,
  rankScale: 1.02,
  cardExitMs: motion.questionStepMs,
  cardReturnMs: motion.previousQuestionMs,
  cardFollowPx: 200,
  cardTiltDiv: 22,
} as const;

export const activityEasing = {
  quick: Easing.bezier(0.25, 0, 0, 1),
  standard: Easing.bezier(0.42, 0, 0.58, 1),
  gentle: Easing.bezier(0.45, 0, 0.55, 1),
} as const;
