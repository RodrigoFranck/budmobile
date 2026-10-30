import { supabase } from '@/integrations/supabase/client';
import { noteRelationError, relationAvailable } from '@/lib/schemaAvailability';
import type { StoredDailyLetter } from '@/utils/dailyLetter';

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
