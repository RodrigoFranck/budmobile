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
  muted: string;
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

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(fromHex: string, toHex: string, amount: number): string {
  const [fr, fg, fb] = hexToRgb(fromHex);
  const [tr, tg, tb] = hexToRgb(toHex);
  const r = Math.round(fr + (tr - fr) * amount);
  const g = Math.round(fg + (tg - fg) * amount);
  const b = Math.round(fb + (tb - fb) * amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
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
  const ink = lightColors['chat-body'];
  const wash = isDark ? accent : mixHex(accent, ink, 0.22);

  return {
    accent,
    border: hexToRgba(wash, isDark ? 0.42 : 0.62),
    fillFrom: hexToRgba(wash, isDark ? 0.28 : 0.4),
    fillTo: isDark ? 'rgba(255,255,255,0.04)' : hexToRgba(wash, 0.18),
    badgeBg: hexToRgba(wash, isDark ? 0.2 : 0.3),
    badgeText: isDark ? 'rgba(255,255,255,0.82)' : mixHex(accent, ink, 0.48),
    title,
    muted: isDark ? 'rgba(239, 234, 230, 0.62)' : lightColors['chat-label-muted'],
  };
}
