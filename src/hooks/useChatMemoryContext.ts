import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { useInternalProfile } from '@/hooks/useInternalProfile';
import { useUserInsightsQuery } from '@/hooks/useUserInsightsQuery';
import { supabase } from '@/integrations/supabase/client';
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

async function fetchSessionMemoryExtras(userId: string): Promise<{
  sessionSummaries: string[];
  biographicalNotes: string | null;
}> {
  const [summariesRes, bioRes] = await Promise.all([
    supabase
      .from('session_summaries')
      .select('summary_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('profiles')
      .select('biographical_notes')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  return {
    sessionSummaries: (summariesRes.data ?? [])
      .map((row) => row.summary_text)
      .filter(Boolean),
    biographicalNotes: bioRes.data?.biographical_notes ?? null,
  };
}

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
  const {
    data: sessionExtras,
    isLoading: sessionExtrasLoading,
  } = useQuery({
    queryKey: queryKeys.sessionMemoryExtras(user?.id ?? ''),
    queryFn: () => fetchSessionMemoryExtras(user!.id),
    enabled: !!user?.id,
  });

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
    {
      sessionSummaries: sessionExtras?.sessionSummaries,
      biographicalNotes: sessionExtras?.biographicalNotes,
    },
  );

  const extrasLoading =
    !!user?.id &&
    ((conversationsLoading && conversations.length === 0) ||
      (insightsLoading && !insights) ||
      sessionExtrasLoading ||
      ((isFetching || insightsFetching) &&
        previousConversations.length === 0 &&
        recentInsights.length === 0 &&
        !insights));

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userInsights(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionMemoryExtras(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.internalProfile(user.id) }),
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
