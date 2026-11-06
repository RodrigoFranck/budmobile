export const WEEKLY_SUMMARY_MIN_DAYS = 2;

export const WEEKLY_SUMMARY_MIN_COPY =
  'Converse em pelo menos 2 dias para receber seu resumo da semana';

export const WEEK_DOT_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;

const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';

export type WeeklySummaryCardPhase = 'locked' | 'minimum' | 'ready';

export type WeeklySummaryDot = {
  label: string;
  active: boolean;
};

type BrasiliaParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function readParts(date: Date): BrasiliaParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRASILIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour') % 24,
    minute: read('minute'),
  };
}

export function formatBrasiliaDateKey(date: Date): string {
  const { year, month, day } = readParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentWeekStartKey(now = new Date()): string {
  const { year, month, day } = readParts(now);
  const local = new Date(year, month - 1, day);
  const weekday = local.getDay();
  const diff = local.getDate() - weekday + (weekday === 0 ? -6 : 1);
  local.setDate(diff);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, '0');
  const d = String(local.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weeklySummarySundayKey(weekStartKey: string): string {
  return addDaysToDateKey(weekStartKey, 6);
}

function isOnOrAfterSundayHour(now: Date, weekStartKey: string, hour: number): boolean {
  const sunday = weeklySummarySundayKey(weekStartKey);
  const parts = readParts(now);
  const today = formatBrasiliaDateKey(now);
  if (today > sunday) return true;
  if (today < sunday) return false;
  return parts.hour >= hour;
}

export function isWeeklySummaryWindowClosed(now: Date, weekStartKey: string): boolean {
  return isOnOrAfterSundayHour(now, weekStartKey, 16);
}

export function isWeeklySummaryReleased(now: Date, weekStartKey: string): boolean {
  return isOnOrAfterSundayHour(now, weekStartKey, 17);
}

export function isUserMessageInWeeklyWindow(createdAt: Date, weekStartKey: string): boolean {
  const sunday = weeklySummarySundayKey(weekStartKey);
  const dayKey = formatBrasiliaDateKey(createdAt);
  if (dayKey < weekStartKey || dayKey > sunday) return false;
  if (dayKey < sunday) return true;
  return readParts(createdAt).hour < 16;
}

export function qualifyingConversationDays(
  createdAts: Array<Date | string>,
  weekStartKey: string,
): string[] {
  const days = new Set<string>();
  for (const value of createdAts) {
    const createdAt = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(createdAt.getTime())) continue;
    if (!isUserMessageInWeeklyWindow(createdAt, weekStartKey)) continue;
    days.add(formatBrasiliaDateKey(createdAt));
  }
  return Array.from(days).sort();
}

export function weeklySummaryDots(activeDateKeys: string[], weekStartKey: string): WeeklySummaryDot[] {
  const active = new Set(activeDateKeys);
  return WEEK_DOT_LABELS.map((label, index) => ({
    label,
    active: active.has(addDaysToDateKey(weekStartKey, index)),
  }));
}

export function resolveWeeklySummaryCard(input: {
  now?: Date;
  weekStartKey: string;
  qualifyingDays: number;
  hasCachedSummary: boolean;
}): WeeklySummaryCardPhase {
  const now = input.now ?? new Date();
  const released = isWeeklySummaryReleased(now, input.weekStartKey);
  if (
    released &&
    input.qualifyingDays >= WEEKLY_SUMMARY_MIN_DAYS &&
    input.hasCachedSummary
  ) {
    return 'ready';
  }
  if (
    isWeeklySummaryWindowClosed(now, input.weekStartKey) &&
    input.qualifyingDays < WEEKLY_SUMMARY_MIN_DAYS
  ) {
    return 'minimum';
  }
  return 'locked';
}

export function canReadWeeklySummary(input: {
  now?: Date;
  weekStartKey: string;
  qualifyingDays: number;
  hasCachedSummary: boolean;
}): boolean {
  if (!input.hasCachedSummary) return false;
  const now = input.now ?? new Date();
  const currentWeek = currentWeekStartKey(now);
  if (input.weekStartKey < currentWeek) return true;
  return (
    input.weekStartKey === currentWeek &&
    input.qualifyingDays >= WEEKLY_SUMMARY_MIN_DAYS &&
    isWeeklySummaryReleased(now, input.weekStartKey)
  );
}
