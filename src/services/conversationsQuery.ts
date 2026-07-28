import { getNowInBrasilia } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Conversation = Tables<'conversations'>;

export async function fetchConversationsWithMessages(
  userId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages!inner(id)')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return [];
  }

  const conversations = data.map(
    ({ messages: _messages, ...conversation }) => conversation as Conversation,
  );

  return Array.from(new Map(conversations.map((c) => [c.id, c])).values());
}

export function filterConversationsByDaysLimit(
  conversations: Conversation[],
  daysLimit?: number,
): Conversation[] {
  if (!daysLimit) {
    return conversations;
  }

  const nowBrasilia = getNowInBrasilia();
  const limitDate = new Date(nowBrasilia);
  limitDate.setDate(limitDate.getDate() - daysLimit);
  limitDate.setHours(0, 0, 0, 0);
  const limitDateStr = limitDate.toISOString().split('T')[0];

  return conversations.filter((c) => {
    const dateSource = c.conversation_date || c.created_at;
    const convDateStr = dateSource.includes('T')
      ? dateSource.split('T')[0]
      : dateSource;
    return convDateStr >= limitDateStr;
  });
}
