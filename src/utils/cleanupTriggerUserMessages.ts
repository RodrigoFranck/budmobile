import * as SecureStore from 'expo-secure-store';

import { supabase } from '@/integrations/supabase/client';
import { looksLikeAppTriggerMessage } from '@/utils/homeRecaps';

const CLEANUP_FLAG_PREFIX = 'tf100_trigger_user_messages_cleaned_v1_';
const CONVERSATION_PAGE = 100;
const MESSAGE_PAGE = 200;

function cleanupFlagKey(userId: string) {
  return `${CLEANUP_FLAG_PREFIX}${userId}`;
}

/**
 * TF-100 · remove mensagens de gatilho já salvas com role=user e limpa títulos
 * derivados delas, para não alimentarem carta, Para começar e resumo.
 */
export async function cleanupTriggerUserMessages(userId: string): Promise<void> {
  if (!userId) return;

  const flagKey = cleanupFlagKey(userId);
  try {
    const done = await SecureStore.getItemAsync(flagKey);
    if (done === '1') return;
  } catch {
    // SecureStore indisponível: tenta limpar mesmo assim nesta sessão.
  }

  try {
    const conversationIds: string[] = [];
    const titlesById = new Map<string, string | null>();
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(from, from + CONVERSATION_PAGE - 1);

      if (error) throw error;
      const rows = data ?? [];
      for (const row of rows) {
        conversationIds.push(row.id);
        titlesById.set(row.id, row.title);
      }
      if (rows.length < CONVERSATION_PAGE) break;
      from += CONVERSATION_PAGE;
    }

    const triggerMessageIds: string[] = [];
    const conversationsWithTrigger = new Set<string>();

    for (let index = 0; index < conversationIds.length; index += MESSAGE_PAGE) {
      const chunk = conversationIds.slice(index, index + MESSAGE_PAGE);
      if (chunk.length === 0) continue;

      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, content')
        .in('conversation_id', chunk)
        .eq('role', 'user');

      if (error) throw error;

      for (const row of data ?? []) {
        if (!looksLikeAppTriggerMessage(row.content)) continue;
        triggerMessageIds.push(row.id);
        conversationsWithTrigger.add(row.conversation_id);
      }
    }

    for (let index = 0; index < triggerMessageIds.length; index += MESSAGE_PAGE) {
      const chunk = triggerMessageIds.slice(index, index + MESSAGE_PAGE);
      if (chunk.length === 0) continue;
      const { error } = await supabase.from('messages').delete().in('id', chunk);
      if (error) throw error;
    }

    const titlesToClear = [...conversationsWithTrigger].filter((id) =>
      looksLikeAppTriggerMessage(titlesById.get(id)),
    );

    for (let index = 0; index < titlesToClear.length; index += MESSAGE_PAGE) {
      const chunk = titlesToClear.slice(index, index + MESSAGE_PAGE);
      if (chunk.length === 0) continue;
      const { error } = await supabase
        .from('conversations')
        .update({ title: null })
        .in('id', chunk);
      if (error) throw error;
    }

    try {
      await SecureStore.setItemAsync(flagKey, '1');
    } catch {
      // Flag opcional; a limpeza já rodou.
    }
  } catch (error) {
    console.warn('TF-100 trigger message cleanup failed:', error);
  }
}
