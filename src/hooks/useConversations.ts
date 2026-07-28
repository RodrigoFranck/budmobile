import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { Conversation } from '@/services/conversationsQuery';
import { getTodayInBrasilia } from '@/utils/dateUtils';

export function useConversations(daysLimit?: number) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { conversations, isLoading, isFetching, refetch: refetchQuery } =
    useConversationsQuery(daysLimit);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let refetchTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefetch = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
      }, 400);
    };

    const channel = supabase
      .channel(`conversations-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const getOrCreateTodayConversation = useCallback(async () => {
    if (!userId) return null;

    try {
      const today = getTodayInBrasilia();

      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_date', today)
        .eq('is_archived', false)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingConversation) {
        return existingConversation;
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          conversation_date: today,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          const { data: retryData } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .eq('conversation_date', today)
            .eq('is_archived', false)
            .maybeSingle();

          return retryData;
        }
        throw createError;
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
      return newConversation;
    } catch (error) {
      console.error("Error getting or creating today's conversation:", error);
      return null;
    }
  }, [queryClient, userId]);

  const createConversation = useCallback(async () => {
    return getOrCreateTodayConversation();
  }, [getOrCreateTodayConversation]);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);

        if (error) throw error;

        if (userId) {
          queryClient.setQueryData<Conversation[]>(
            queryKeys.conversations(userId),
            (prev) => (prev ?? []).filter((conv) => conv.id !== conversationId),
          );
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }
    },
    [queryClient, userId],
  );

  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) throw error;

      if (userId) {
        queryClient.setQueryData<Conversation[]>(
          queryKeys.conversations(userId),
          (prev) => (prev ?? []).filter((conv) => conv.id !== conversationId),
        );
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  }, [queryClient, userId]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!userId) return;
      await refetchQuery();
      void options;
    },
    [refetchQuery, userId],
  );

  return {
    conversations,
    loading: isLoading || (isFetching && conversations.length === 0),
    createConversation,
    getOrCreateTodayConversation,
    deleteConversation,
    archiveConversation,
    refetch,
  };
}
