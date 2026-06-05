import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useInternalProfile } from '@/hooks/useInternalProfile';
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrasilia } from '@/utils/dateUtils';
import {
  buildChatMemoryContext,
  type ChatMemoryContext,
  type MemoryInsight,
  type PreviousConversationMemory,
} from '@/utils/formatInternalProfile';

const PREVIOUS_CONVERSATIONS_LIMIT = 5;
const RECENT_INSIGHTS_LIMIT = 4;

const INSIGHT_TYPES = [
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
  'deep_insight',
  'checkin',
] as const;

export function useChatMemoryContext() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useInternalProfile();
  const [previousConversations, setPreviousConversations] = useState<
    PreviousConversationMemory[]
  >([]);
  const [recentInsights, setRecentInsights] = useState<MemoryInsight[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(true);

  const fetchMemoryExtras = useCallback(async () => {
    if (!user) {
      setPreviousConversations([]);
      setRecentInsights([]);
      setExtrasLoading(false);
      return;
    }

    setExtrasLoading(true);
    const today = getTodayInBrasilia();

    try {
      const [conversationsResult, insightsResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('conversation_date, title, updated_at')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .neq('conversation_date', today)
          .not('title', 'is', null)
          .order('conversation_date', { ascending: false })
          .limit(PREVIOUS_CONVERSATIONS_LIMIT),
        supabase
          .from('user_insights')
          .select('insight_type, title, description, context_summary')
          .eq('user_id', user.id)
          .in('insight_type', [...INSIGHT_TYPES])
          .or('locked.eq.false,locked.is.null')
          .order('insight_date', { ascending: false })
          .limit(RECENT_INSIGHTS_LIMIT),
      ]);

      if (conversationsResult.error) {
        console.error('Error fetching previous conversations:', conversationsResult.error);
      }

      if (insightsResult.error) {
        console.error('Error fetching recent insights:', insightsResult.error);
      }

      const conversations = (conversationsResult.data ?? [])
        .filter((item) => item.title?.trim())
        .map((item) => ({
          date: item.conversation_date ?? item.updated_at.split('T')[0],
          title: item.title!.trim(),
        }));

      const insights = (insightsResult.data ?? []).map((item) => ({
        insight_type: item.insight_type,
        title: item.title,
        description: item.description,
        context_summary: item.context_summary,
      }));

      setPreviousConversations(conversations);
      setRecentInsights(insights);
    } catch (error) {
      console.error('Error fetching chat memory context:', error);
      setPreviousConversations([]);
      setRecentInsights([]);
    } finally {
      setExtrasLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchMemoryExtras();
  }, [fetchMemoryExtras]);

  const memoryContext: ChatMemoryContext = buildChatMemoryContext(
    profile,
    previousConversations,
    recentInsights,
  );

  return {
    memoryContext,
    internalProfileText: memoryContext.internalProfileText,
    profile,
    loading: profileLoading || extrasLoading,
    refetch: fetchMemoryExtras,
  };
}
