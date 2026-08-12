import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export const EXPLORE_AND_MEMORY_INSIGHT_TYPES = [
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
  'deep_insight',
  'checkin',
] as const;

export type StoredUserInsightRow = {
  insight_type: string;
  title: string;
  description: string;
  locked: boolean | null;
  context_summary: string | null;
  internal_context: string | null;
  conversation_id: string | null;
  generated_at: string | null;
  insight_date: string | null;
  week_start: string | null;
  content_json: unknown;
};

export async function fetchUserInsights(userId: string): Promise<StoredUserInsightRow[]> {
  const { data, error } = await supabase
    .from('user_insights')
    .select(
      'insight_type, title, description, locked, context_summary, internal_context, conversation_id, generated_at, insight_date, week_start, content_json',
    )
    .eq('user_id', userId)
    .in('insight_type', [...EXPLORE_AND_MEMORY_INSIGHT_TYPES]);

  if (error) {
    throw error;
  }

  return (data ?? []) as StoredUserInsightRow[];
}

export function useUserInsightsQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.userInsights(userId ?? ''),
    queryFn: () => fetchUserInsights(userId!),
    enabled: !!userId,
  });
}
