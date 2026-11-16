import * as SecureStore from 'expo-secure-store';

import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrasilia } from '@/utils/dateUtils';
import { countDisplayableHistoryTurns } from '@/utils/historyMessages';

const CLEANUP_FLAG_PREFIX = 'tf108_empty_conversations_cleaned_v1_';
const CONVERSATION_PAGE = 100;
const MESSAGE_PAGE = 200;

function cleanupFlagKey(userId: string) {
  return `${CLEANUP_FLAG_PREFIX}${userId}`;
}

/**
 * TF-108 · remove conversas sem nenhuma troca exibível (stubs vazios /
 * sessões criadas sem a pessoa conversar), para não abrirem o detalhe vazio.
 * Não toca na conversa de hoje (pode estar sendo aberta agora).
 */
export async function cleanupEmptyConversations(userId: string): Promise<boolean> {
  if (!userId) return false;

  const flagKey = cleanupFlagKey(userId);
  try {
    const done = await SecureStore.getItemAsync(flagKey);
    if (done === '1') return false;
  } catch {
    // SecureStore indisponível: tenta limpar mesmo assim nesta sessão.
  }

  let deletedAny = false;

  try {
    const today = getTodayInBrasilia();
    const conversations: Array<{ id: string; conversation_date: string | null }> = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, conversation_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(from, from + CONVERSATION_PAGE - 1);

      if (error) throw error;
      const rows = data ?? [];
      for (const row of rows) {
        if (row.conversation_date === today) continue;
        conversations.push(row);
      }
      if (rows.length < CONVERSATION_PAGE) break;
      from += CONVERSATION_PAGE;
    }

    const conversationIds = conversations.map((row) => row.id);
    const displayableByConversation = new Map<string, number>();

    for (let index = 0; index < conversationIds.length; index += MESSAGE_PAGE) {
      const chunk = conversationIds.slice(index, index + MESSAGE_PAGE);
      if (chunk.length === 0) continue;

      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, role, content')
        .in('conversation_id', chunk);

      if (error) throw error;

      const byConversation = new Map<string, Array<{ role: string; content: string }>>();
      for (const row of data ?? []) {
        const list = byConversation.get(row.conversation_id) ?? [];
        list.push({ role: row.role, content: row.content });
        byConversation.set(row.conversation_id, list);
      }

      for (const id of chunk) {
        displayableByConversation.set(
          id,
          countDisplayableHistoryTurns(byConversation.get(id) ?? []),
        );
      }
    }

    const emptyIds = conversationIds.filter(
      (id) => (displayableByConversation.get(id) ?? 0) <= 0,
    );

    for (let index = 0; index < emptyIds.length; index += MESSAGE_PAGE) {
      const chunk = emptyIds.slice(index, index + MESSAGE_PAGE);
      if (chunk.length === 0) continue;

      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', chunk);
      if (messagesError) throw messagesError;

      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .in('id', chunk);
      if (conversationsError) throw conversationsError;

      deletedAny = true;
    }

    try {
      await SecureStore.setItemAsync(flagKey, '1');
    } catch {
      // Flag opcional; a limpeza já rodou.
    }
  } catch (error) {
    console.warn('TF-108 empty conversation cleanup failed:', error);
  }

  return deletedAny;
}
