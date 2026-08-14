import { ExploreInsightGradients, type ExploreInsightKey } from '@/constants/exploreInsights';
import { darkColors, lightColors } from '@/lib/colors';

export type InsightVisualCategory =
  | ExploreInsightKey
  | 'inspired'
  | 'checkin_morning'
  | 'checkin_post_training'
  | 'checkin_post_game';

export type InsightCardPalette = {
  accent: string;
  border: string;
  fillFrom: string;
  fillTo: string;
  badgeBg: string;
  badgeText: string;
  title: string;
};

const CHECKIN_ACCENTS: Record<
  'checkin_morning' | 'checkin_post_training' | 'checkin_post_game',
  string
> = {
  checkin_morning: '#F59E0B',
  checkin_post_training: '#A78BFA',
  checkin_post_game: '#D97706',
};

const INSPIRED_ACCENT = '#8BA3B0';

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getExploreAccent(key: ExploreInsightKey, isDark: boolean): string {
  if (key === 'habit' && !isDark) {
    return lightColors['chat-accent-mint'];
  }

  return ExploreInsightGradients[key].screen[isDark ? 'dark' : 'light'].base[2];
}

export function resolveInsightVisualCategory(params: {
  insightType?: string;
  backgroundType?: string;
  category?: string;
}): InsightVisualCategory {
  const raw = [params.category, params.insightType, params.backgroundType]
    .map((value) => value?.trim())
    .find(Boolean);

  if (!raw) {
    return 'inspired';
  }

  if (raw === 'yesterday' || raw === 'yesterday_journey') {
    return 'yesterday_journey';
  }
  if (raw === 'frequency') {
    return 'frequency';
  }
  if (raw === 'habit') {
    return 'habit';
  }
  if (raw === 'morning' || raw === 'checkin_morning') {
    return 'checkin_morning';
  }
  if (raw === 'post_training' || raw === 'checkin_post_training') {
    return 'checkin_post_training';
  }
  if (raw === 'post_game' || raw === 'checkin_post_game') {
    return 'checkin_post_game';
  }

  return 'inspired';
}

export function getInsightCardPalette(
  category: InsightVisualCategory,
  isDark: boolean,
): InsightCardPalette {
  let accent = INSPIRED_ACCENT;

  if (category === 'yesterday_journey' || category === 'frequency' || category === 'habit') {
    accent = getExploreAccent(category, isDark);
  } else if (category in CHECKIN_ACCENTS) {
    accent = CHECKIN_ACCENTS[category as keyof typeof CHECKIN_ACCENTS];
  }

  const title = isDark ? darkColors['chat-body'] : lightColors['chat-body'];

  return {
    accent,
    border: hexToRgba(accent, isDark ? 0.42 : 0.48),
    fillFrom: hexToRgba(accent, isDark ? 0.28 : 0.2),
    fillTo: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(29,25,22,0.03)',
    badgeBg: hexToRgba(accent, isDark ? 0.2 : 0.16),
    badgeText: isDark ? 'rgba(255,255,255,0.82)' : hexToRgba(accent, 0.92),
    title,
  };
}
