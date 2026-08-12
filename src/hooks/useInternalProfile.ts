import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface EmotionalPattern {
  pattern: string;
  frequency: string;
  context: string;
}

export interface RecurringTheme {
  theme: string;
  importance: string;
  evolution: string;
}

export interface CommunicationStyle {
  preferred_tone?: string;
  response_length?: string;
  needs_validation?: boolean;
  prefers_questions?: boolean;
  other_notes?: string;
}

export interface BlindSpot {
  area: string;
  approach: string;
}

export interface EffectiveApproach {
  approach: string;
  context: string;
}

export interface InternalProfile {
  emotional_patterns: EmotionalPattern[];
  recurring_themes: RecurringTheme[];
  communication_style: CommunicationStyle;
  blind_spots: BlindSpot[];
  journey_summary: string | null;
  clinical_insights: string | null;
  effective_approaches: EffectiveApproach[];
  conversations_analyzed: number;
  last_consolidated_at: string | null;
}

async function fetchInternalProfile(userId: string): Promise<InternalProfile | null> {
  const { data, error } = await supabase
    .from('user_internal_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    emotional_patterns: (data.emotional_patterns as unknown as EmotionalPattern[]) || [],
    recurring_themes: (data.recurring_themes as unknown as RecurringTheme[]) || [],
    communication_style: (data.communication_style as unknown as CommunicationStyle) || {},
    blind_spots: (data.blind_spots as unknown as BlindSpot[]) || [],
    journey_summary: data.journey_summary,
    clinical_insights: data.clinical_insights ?? null,
    effective_approaches: (data.effective_approaches as unknown as EffectiveApproach[]) || [],
    conversations_analyzed: data.conversations_analyzed || 0,
    last_consolidated_at: data.last_consolidated_at,
  };
}

export function useInternalProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.internalProfile(userId ?? ''),
    queryFn: () => fetchInternalProfile(userId!),
    enabled: !!userId,
  });

  return {
    profile: data ?? null,
    loading: !!userId && (isLoading || (isFetching && data === undefined)),
  };
}
