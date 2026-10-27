/**
 * Theme colors based on CSS variables
 * These values should match the CSS variables defined in global.css
 */
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const darkColors = {
  background: '#171310',
  foreground: '#F1E6DB',
  'foreground-muted': '#A39C93',
  muted: '#201B18',
  'muted-foreground': '#A39C93',
  primary: '#F1E6DA',
  'primary-foreground': '#171312',
  secondary: '#2A2522',
  'secondary-foreground': '#F1E6DB',
  accent: '#B0EDEE',
  'accent-foreground': '#171311',
  destructive: 'hsl(0, 84.2%, 60.2%)',
  'destructive-foreground': 'hsl(0, 0%, 100%)',
  border: '#3A332D',
  input: '#2A2522',
  ring: '#A39C93',
  card: '#201B18',
  'card-foreground': '#F1E6DB',
  popover: '#201B18',
  'popover-foreground': '#F1E6DB',
  'chat-user-bg': '#201B18',
  'chat-assistant-bg': '#171310',
  'chat-warm-bg': '#171310',
  'chat-input-pill': '#2A2522',
  'chat-mic-peach': '#B0EDEE',
  'chat-mic-peach-pressed': '#7EC0A8',
  'chat-label-muted': '#7A726A',
  'chat-body': '#F1E6DB',
  'chat-accent-mint': '#B0EDEE',
  'chat-gradient-end': '#2A2522',
} as const;

export const lightColors = {
  background: '#F1E6DB',
  foreground: '#35302B',
  'foreground-muted': '#6E655C',
  muted: '#E5D8CA',
  'muted-foreground': '#6E655C',
  primary: '#2E7F7C',
  'primary-foreground': '#F1E6DB',
  secondary: '#DCCDBD',
  'secondary-foreground': '#35302B',
  accent: '#2E7F7C',
  'accent-foreground': '#F1E6DB',
  destructive: 'hsl(0, 84.2%, 60.2%)',
  'destructive-foreground': 'hsl(0, 0%, 100%)',
  border: '#D3C3B2',
  input: '#E5D8CA',
  ring: '#6E655C',
  card: '#E5D8CA',
  'card-foreground': '#35302B',
  popover: '#E5D8CA',
  'popover-foreground': '#35302B',
  'chat-user-bg': '#E5D8CA',
  'chat-assistant-bg': '#F1E6DB',
  'chat-warm-bg': '#F1E6DB',
  'chat-input-pill': '#E5D8CA',
  'chat-mic-peach': '#2E7F7C',
  'chat-mic-peach-pressed': '#305C5A',
  'chat-label-muted': '#90877F',
  'chat-body': '#35302B',
  'chat-accent-mint': '#2E7F7C',
  'chat-gradient-end': '#DCCDBD',
} as const;

export type AppColors = {
  [K in keyof typeof darkColors]: string;
};

export function useAppColors(): AppColors {
  const { mode } = useTheme();
  return useMemo(() => (mode === 'dark' ? darkColors : lightColors), [mode]);
}

// Back-compat: default export stays dark until migrated
export const colors = darkColors;

