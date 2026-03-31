/**
 * Theme colors based on CSS variables
 * These values should match the CSS variables defined in global.css
 */
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const darkColors = {
  background: 'hsl(0, 0%, 11.8%)',
  foreground: 'hsl(0, 0%, 100%)',
  'foreground-muted': 'hsl(0, 0%, 92%)',
  muted: 'hsl(0, 0%, 16.5%)',
  'muted-foreground': 'hsl(0, 0%, 71%)',
  primary: 'hsl(0, 0%, 100%)',
  'primary-foreground': 'hsl(0, 0%, 11.8%)',
  secondary: 'hsl(0, 0%, 18.4%)',
  'secondary-foreground': 'hsl(0, 0%, 100%)',
  accent: 'hsl(167, 40%, 82%)',
  'accent-foreground': 'hsl(0, 0%, 11.8%)',
  destructive: 'hsl(0, 84.2%, 60.2%)',
  'destructive-foreground': 'hsl(0, 0%, 100%)',
  border: 'hsl(0, 0%, 20%)',
  input: 'hsl(0, 0%, 16.5%)',
  ring: 'hsl(0, 0%, 71%)',
  card: 'hsl(0, 0%, 16.5%)',
  'card-foreground': 'hsl(0, 0%, 100%)',
  popover: 'hsl(0, 0%, 16.5%)',
  'popover-foreground': 'hsl(0, 0%, 100%)',
  'chat-user-bg': 'hsl(0, 0%, 14%)',
  'chat-assistant-bg': 'hsl(0, 0%, 11.8%)',
  /** Journal / chat visual refactor */
  'chat-warm-bg': '#1D1916',
  'chat-input-pill': '#373737',
  'chat-mic-peach': '#BEA99C',
  'chat-mic-peach-pressed': '#BEA99C',
  'chat-label-muted': '#77716C',
  'chat-body': '#EFEAE6',
  'chat-accent-mint': '#BEEEEE',
  'chat-gradient-end': '#3D4F4F',
} as const;

export const lightColors = {
  background: 'hsl(30, 38%, 95%)',
  foreground: 'hsl(20, 16%, 10%)',
  'foreground-muted': 'hsl(20, 12%, 28%)',
  muted: 'hsl(24, 24%, 90%)',
  'muted-foreground': 'hsl(20, 12%, 32%)',
  primary: 'hsl(177, 45%, 33%)',
  'primary-foreground': 'hsl(0, 0%, 100%)',
  secondary: 'hsl(24, 24%, 90%)',
  'secondary-foreground': 'hsl(20, 16%, 10%)',
  accent: 'hsl(167, 40%, 82%)',
  'accent-foreground': 'hsl(20, 16%, 10%)',
  destructive: 'hsl(0, 84.2%, 60.2%)',
  'destructive-foreground': 'hsl(0, 0%, 100%)',
  border: 'hsl(20, 10%, 82%)',
  input: 'hsl(0, 0%, 100%)',
  ring: 'hsl(20, 12%, 48%)',
  card: 'hsl(0, 0%, 100%)',
  'card-foreground': 'hsl(20, 16%, 10%)',
  popover: 'hsl(0, 0%, 100%)',
  'popover-foreground': 'hsl(20, 16%, 10%)',
  'chat-user-bg': 'hsl(30, 22%, 92%)',
  'chat-assistant-bg': 'hsl(30, 38%, 95%)',
  /** Journal / chat visual refactor */
  'chat-warm-bg': '#F7F1ED',
  'chat-input-pill': '#FFFFFF',
  'chat-mic-peach': '#BEA99C',
  'chat-mic-peach-pressed': '#A89284',
  'chat-label-muted': 'rgba(29,25,22,0.55)',
  'chat-body': '#1D1916',
  'chat-accent-mint': '#2E7D7A',
  'chat-gradient-end': '#DDEEEE',
} as const;

export type AppColors = typeof darkColors;

export function useAppColors(): AppColors {
  const { mode } = useTheme();
  return useMemo(() => (mode === 'dark' ? darkColors : lightColors), [mode]);
}

// Back-compat: default export stays dark until migrated
export const colors = darkColors;

