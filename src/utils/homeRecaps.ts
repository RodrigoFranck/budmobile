export const RECAP_LIMIT = 10;
export const RECAP_NEW_PER_DAY = 3;
export const RECAP_LOOKBACK_DAYS = 14;

export type RecapPileItem = {
  id: string;
  addedOn: string;
};

type RecapConversation = {
  id: string;
  title: string | null;
  conversation_date: string | null;
  created_at: string;
};

export function conversationDayKey(dateSource: string) {
  return dateSource.includes('T') ? dateSource.split('T')[0] : dateSource;
}

export function shiftDayKey(day: string, days: number) {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(year, month - 1, date);
  next.setDate(next.getDate() + days);
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function recapCandidateIds(params: {
  conversations: RecapConversation[];
  today: string;
  excludeIds?: Iterable<string>;
  lookbackDays?: number;
}) {
  const lookback = params.lookbackDays ?? RECAP_LOOKBACK_DAYS;
  const minDay = shiftDayKey(params.today, -lookback);
  const excluded = new Set(params.excludeIds ?? []);

  return params.conversations
    .filter((conversation) => {
      if (excluded.has(conversation.id)) return false;
      if (!conversation.title?.trim()) return false;
      const day = conversationDayKey(conversation.conversation_date || conversation.created_at);
      if (day === params.today) return false;
      return day >= minDay;
    })
    .sort((left, right) => {
      const dayLeft = conversationDayKey(left.conversation_date || left.created_at);
      const dayRight = conversationDayKey(right.conversation_date || right.created_at);
      return dayRight.localeCompare(dayLeft);
    })
    .map((conversation) => conversation.id);
}

export function nextRecapPile(params: {
  pile: RecapPileItem[];
  candidateIds: string[];
  today: string;
  limit?: number;
  newPerDay?: number;
}): RecapPileItem[] {
  const limit = params.limit ?? RECAP_LIMIT;
  const newPerDay = params.newPerDay ?? RECAP_NEW_PER_DAY;
  const allowed = new Set(params.candidateIds);
  const existing = params.pile.filter((item) => allowed.has(item.id));
  const existingIds = new Set(existing.map((item) => item.id));
  const addedToday = existing.filter((item) => item.addedOn === params.today).length;
  const remaining = Math.max(0, newPerDay - addedToday);
  const additions = params.candidateIds
    .filter((id) => !existingIds.has(id))
    .slice(0, remaining)
    .map((id) => ({ id, addedOn: params.today }));

  return [...additions, ...existing].slice(0, limit);
}

export function clipCardText(text: string, max = 220) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
  if (lastStop >= 80) return slice.slice(0, lastStop + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

export function recapQuote(fragment?: string | null, fallback?: string | null) {
  const fromFragment = fragment?.trim().replace(/^[“”"']+|[“”"']+$/g, '');
  if (fromFragment) return clipCardText(fromFragment, 88);
  return fallback?.trim() ?? '';
}

export function recapInvite(dateLabel: string) {
  const when = dateLabel.trim().toLowerCase();
  if (when === 'ontem') {
    return 'Isso ficou de ontem. Quer conversar sobre o que ainda está aberto nisso?';
  }
  return `Isso ficou de ${when}. Quer conversar sobre o que ainda está aberto nisso?`;
}

export function parseRecapPile(raw: string | null): RecapPileItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const id = 'id' in item && typeof item.id === 'string' ? item.id : '';
      const addedOn = 'addedOn' in item && typeof item.addedOn === 'string' ? item.addedOn : '';
      return id && addedOn ? [{ id, addedOn }] : [];
    });
  } catch {
    return [];
  }
}
