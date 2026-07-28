import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { useInternalProfile } from '@/hooks/useInternalProfile';
import { useUserInsightsQuery } from '@/hooks/useUserInsightsQuery';
import { queryKeys } from '@/lib/queryKeys';
import { getTodayInBrasilia } from '@/utils/dateUtils';
import {
  buildChatMemoryContext,
  type ChatMemoryContext,
  type MemoryInsight,
  type PreviousConversationMemory,
} from '@/utils/formatInternalProfile';

const PREVIOUS_CONVERSATIONS_LIMIT = 5;
const RECENT_INSIGHTS_LIMIT = 4;

export function useChatMemoryContext() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useInternalProfile();
  const { conversations, isLoading: conversationsLoading, isFetching } =
    useConversationsQuery();
  const {
    data: insights,
    isLoading: insightsLoading,
    isFetching: insightsFetching,
  } = useUserInsightsQuery();

  const previousConversations = useMemo<PreviousConversationMemory[]>(() => {
    if (!user?.id) return [];
    const today = getTodayInBrasilia();

    return conversations
      .filter(
        (item) =>
          item.conversation_date !== today &&
          !!item.title?.trim(),
      )
      .slice(0, PREVIOUS_CONVERSATIONS_LIMIT)
      .map((item) => ({
        date: item.conversation_date ?? item.updated_at.split('T')[0],
        title: item.title!.trim(),
      }));
  }, [conversations, user?.id]);

  const recentInsights = useMemo<MemoryInsight[]>(() => {
    if (!insights?.length) return [];

    return insights
      .filter((item) => item.locked === false || item.locked == null)
      .sort((a, b) => {
        const aDate = a.insight_date ?? '';
        const bDate = b.insight_date ?? '';
        return bDate.localeCompare(aDate);
      })
      .slice(0, RECENT_INSIGHTS_LIMIT)
      .map((item) => ({
        insight_type: item.insight_type,
        title: item.title,
        description: item.description,
        context_summary: item.context_summary,
      }));
  }, [insights]);

  const memoryContext: ChatMemoryContext = buildChatMemoryContext(
    profile,
    previousConversations,
    recentInsights,
  );

  const extrasLoading =
    !!user?.id &&
    ((conversationsLoading && conversations.length === 0) ||
      (insightsLoading && !insights) ||
      ((isFetching || insightsFetching) &&
        previousConversations.length === 0 &&
        recentInsights.length === 0 &&
        !insights));

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userInsights(user.id) }),
    ]);
  }, [queryClient, user?.id]);

  return {
    memoryContext,
    internalProfileText: memoryContext.internalProfileText,
    profile,
    loading: profileLoading || extrasLoading,
    refetch,
  };
}
