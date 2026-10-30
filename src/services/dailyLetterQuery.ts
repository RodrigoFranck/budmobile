import { supabase } from '@/integrations/supabase/client';
import { noteRelationError, relationAvailable } from '@/lib/schemaAvailability';
import type { StoredDailyLetter } from '@/utils/dailyLetter';

function asStoredLetter(value: unknown): StoredDailyLetter | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<StoredDailyLetter>;
  if (!row.id || !row.letter_date || !row.title?.trim() || !row.body?.trim()) {
    return null;
  }
  return {
    id: row.id,
    letter_date: row.letter_date,
    title: row.title,
    body: row.body,
    opened_at: row.opened_at ?? null,
    source: row.source ?? null,
  };
}

export async function fetchStoredDailyLetter(
  userId: string,
  letterDate: string,
): Promise<StoredDailyLetter | null> {
  if (!relationAvailable('daily_letters')) {
    return null;
  }

  const { data, error } = await supabase
    .from('daily_letters')
    .select('id, letter_date, title, body, opened_at, source')
    .eq('user_id', userId)
    .eq('letter_date', letterDate)
    .maybeSingle();

  if (error) {
    if (!noteRelationError('daily_letters', error)) {
      console.error('Error fetching daily letter:', error);
    }
    return null;
  }

  if (!data?.body?.trim()) {
    return null;
  }

  return {
    id: data.id,
    letter_date: data.letter_date,
    title: data.title,
    body: data.body,
    opened_at: data.opened_at,
    source: data.source,
  };
}

export async function requestGeneratedDailyLetter(): Promise<StoredDailyLetter | null> {
  const { data, error } = await supabase.functions.invoke('generate-daily-letter');
  if (error) {
    console.warn('Daily letter generation failed:', error.message);
    return null;
  }
  return asStoredLetter((data as { letter?: unknown } | null)?.letter);
}

export async function loadDailyLetter(params: {
  userId: string;
  letterDate: string;
  hadYesterdayConversation: boolean;
}): Promise<StoredDailyLetter | null> {
  const existing = await fetchStoredDailyLetter(params.userId, params.letterDate);
  if (existing) return existing;
  if (!params.hadYesterdayConversation) return null;
  return requestGeneratedDailyLetter();
}

export async function markStoredDailyLetterOpened(letterId: string, openedAt: string) {
  if (!relationAvailable('daily_letters')) {
    return;
  }

  const { error } = await supabase
    .from('daily_letters')
    .update({ opened_at: openedAt })
    .eq('id', letterId);

  if (error && !noteRelationError('daily_letters', error)) {
    console.error('Error marking daily letter opened:', error);
  }
}

export async function fetchFirstUserSnippets(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at')
    .in('conversation_id', conversationIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching recap snippets:', error);
    return {} as Record<string, string>;
  }

  const snippets: Record<string, string> = {};
  for (const row of data ?? []) {
    if (snippets[row.conversation_id]) continue;
    const content = row.content?.trim();
    if (content) snippets[row.conversation_id] = content;
  }
  return snippets;
}
