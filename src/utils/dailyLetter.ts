export const YESTERDAY_CARD_QUOTE = 'O que ficou de ontem?';

export type StoredDailyLetter = {
  id: string;
  letter_date: string;
  title: string;
  body: string;
  opened_at: string | null;
  source?: string | null;
};

export type DailyLetterInsight = {
  title?: string | null;
  description?: string | null;
  locked?: boolean;
  contextSummary?: string | null;
};

const LOCKED_TITLES = new Set([
  'Ainda estou te conhecendo',
  'Faça login para ver seus insights',
]);

export function isUsableLetterInsight(insight?: DailyLetterInsight | null): boolean {
  if (!insight || insight.locked) return false;
  const title = insight.title?.trim() ?? '';
  const body = insight.description?.trim() ?? '';
  if (!body) return false;
  if (LOCKED_TITLES.has(title)) return false;
  if (body.startsWith('Quando a gente conversar')) return false;
  return true;
}

export function resolveDailyLetter(params: {
  today: string;
  hadYesterdayConversation: boolean;
  stored: StoredDailyLetter | null;
  insight?: DailyLetterInsight | null;
  openedAt?: string | null;
}): { available: boolean; letter: StoredDailyLetter | null } {
  if (!params.hadYesterdayConversation) {
    return { available: false, letter: null };
  }

  const storedBody = params.stored?.body?.trim() ?? '';
  if (params.stored && storedBody) {
    return { available: true, letter: params.stored };
  }

  if (isUsableLetterInsight(params.insight)) {
    return {
      available: true,
      letter: {
        id: `insight-${params.today}`,
        letter_date: params.today,
        title: params.insight?.title?.trim() || YESTERDAY_CARD_QUOTE,
        body: params.insight?.description?.trim() ?? '',
        opened_at: params.openedAt ?? null,
        source: 'yesterday_insight',
      },
    };
  }

  return { available: false, letter: null };
}
