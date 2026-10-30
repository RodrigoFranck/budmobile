import { useMemo } from 'react';

import { useTheme } from '@/contexts/ThemeContext';

export const v3DarkColors = {
  bg: '#171310',
  surface: '#201B18',
  surface2: '#2A2522',
  line: '#3A332D',
  text: '#F1E6DB',
  text2: '#A39C93',
  text3: '#7A726A',
  accent: '#B0EDEE',
  btn: '#F1E6DA',
  onBtn: '#171312',
  onAccent: '#171311',
  scrim: '#0D0B09',
} as const;

export const v3LightColors = {
  bg: '#F1E6DB',
  surface: '#E5D8CA',
  surface2: '#DCCDBD',
  line: '#D3C3B2',
  text: '#35302B',
  text2: '#6E655C',
  text3: '#90877F',
  accent: '#2E7F7C',
  btn: '#35302B',
  onBtn: '#F1E6DB',
  onAccent: '#F1E6DB',
  scrim: '#BFB2A4',
} as const;

export const activityColors = {
  folha: '#7EC0A8',
  menta: '#B0EDEE',
  ardosia: '#708B97',
  argila: '#D9C8B4',
  agua: '#2E7F7C',
  pinho: '#305C5A',
} as const;

export const fonts = {
  display: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansItalic: 'DMSans_400Regular_Italic',
  sansMedium: 'DMSans_500Medium',
  sansSemi: 'DMSans_600SemiBold',
} as const;

export const motion = {
  letterFlapMs: 450,
  letterRiseMs: 800,
  letterEnterMs: 1200,
  letterExitMs: 1100,
  letterOpenMs: 2450,
  letterDissolveMs: 600,
  activitySheetMs: 420,
  questionStepMs: 450,
  sproutSpinMs: 550,
  fieeHoldMs: 700,
  chipMs: 300,
  optionMs: 250,
  nextQuestionMs: 400,
  previousQuestionMs: 350,
  moodMs: 450,
  sheetMs: 300,
  fadeExitMs: 450,
  reorderMs: 200,
} as const;

export type V3Colors = {
  [K in keyof typeof v3DarkColors]: string;
};

export function useV3Colors(): V3Colors {
  const { mode } = useTheme();
  return useMemo(() => (mode === 'dark' ? v3DarkColors : v3LightColors), [mode]);
}
