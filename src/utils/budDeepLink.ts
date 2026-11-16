import type { PendingPushTarget } from '@/utils/pushNotificationNavigation';

const BUD_HOSTS = new Set(['bud', 'com.bud.app']);

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** Parse `bud://…` / `com.bud.app://…` notification deep links into push targets. */
export function resolveBudDeepLink(url: string): PendingPushTarget | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const scheme = parsed.protocol.replace(':', '');
  if (!BUD_HOSTS.has(scheme) && !BUD_HOSTS.has(parsed.hostname)) {
    return null;
  }

  // bud://home?carta=…  → host=home, pathname empty or /
  // bud://historico/resumo?semana=… → host=historico, pathname=/resumo
  const host = parsed.hostname || parsed.host;
  const pathParts = stripTrailingSlash(parsed.pathname)
    .split('/')
    .filter(Boolean);
  const segments =
    host && host !== 'bud' && !host.includes('.')
      ? [host, ...pathParts]
      : pathParts;

  const [first, second] = segments;
  if (!first) {
    return null;
  }

  if (first === 'home') {
    const carta = parsed.searchParams.get('carta') ?? undefined;
    return { kind: 'home', letterDate: carta || undefined };
  }

  if (first === 'historico' && second === 'resumo') {
    const semana = parsed.searchParams.get('semana') ?? undefined;
    return { kind: 'weeklySummary', weekKey: semana || undefined };
  }

  if (first === 'pesquisa') {
    return { kind: 'screening' };
  }

  if (first === 'chat') {
    return { kind: 'emptyChat' };
  }

  return null;
}

export function isoWeekFromMonday(mondayYmd: string): string {
  const [y, m, d] = mondayYmd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const weekYear = date.getUTCFullYear();
  const week1 = new Date(Date.UTC(weekYear, 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7,
    );
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

export function mondayFromIsoWeek(weekKey: string): string | undefined {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey.trim());
  if (!match) {
    return undefined;
  }
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
