import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DeepInsight {
  headline: string;
  intro: string;
  what_i_noticed: {
    title: string;
    content: string;
  };
  reflection: {
    title: string;
    content: string;
  };
  key_takeaway: {
    title: string;
    content: string;
  };
  next_steps: {
    title: string;
    content: string;
  };
}

export type DeepInsightStatus = 
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'insufficient_conversations'
  | 'no_insight_for_week'
  | 'error';

export interface DeepInsightState {
  status: DeepInsightStatus;
  insight: DeepInsight | null;
  weeklyConversationCount: number;
  requiredConversations: number;
  message: string | null;
  error: string | null;
}

// Helper: Calcula segunda-feira da semana (seg-dom) - mantido para compatibilidade
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useDeepInsight() {
  const [state, setState] = useState<DeepInsightState>({
    status: 'idle',
    insight: null,
    weeklyConversationCount: 0,
    requiredConversations: 5,
    message: null,
    error: null,
  });

  const [cachedInsights, setCachedInsights] = useState<Map<string, DeepInsight>>(new Map());

  const generateDeepInsight = useCallback(async (weekStart?: Date): Promise<DeepInsight | null> => {
    const targetWeekStart = weekStart || getWeekStart(new Date());
    const weekStartStr = targetWeekStart.toISOString().split('T')[0];

    // Verificar cache
    if (cachedInsights.has(weekStartStr)) {
      const cached = cachedInsights.get(weekStartStr)!;
      setState({
        status: 'loaded',
        insight: cached,
        weeklyConversationCount: 5,
        requiredConversations: 5,
        message: null,
        error: null,
      });
      return cached;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-deep-insight',
        {
          body: { week_start: weekStartStr },
        }
      );

      if (functionError) {
        console.error('Error generating deep insight:', functionError);
        throw new Error(functionError.message || 'Erro ao gerar insight aprofundado');
      }

      // Handle different response statuses
      if (functionData?.status === 'insufficient_conversations') {
        setState({
          status: 'insufficient_conversations',
          insight: null,
          weeklyConversationCount: functionData.current || 0,
          requiredConversations: functionData.required || 5,
          message: functionData.message,
          error: null,
        });
        return null;
      }

      if (functionData?.status === 'no_insight_for_week') {
        setState({
          status: 'no_insight_for_week',
          insight: null,
          weeklyConversationCount: 0,
          requiredConversations: 5,
          message: functionData.message,
          error: null,
        });
        return null;
      }

      if (functionData?.error) {
        throw new Error(functionData.message || 'Erro ao gerar insight');
      }

      // Success - got a full insight
      const insight = functionData as DeepInsight;
      
      // Cache the insight
      setCachedInsights(prev => new Map(prev).set(weekStartStr, insight));
      
      setState({
        status: 'loaded',
        insight,
        weeklyConversationCount: 5,
        requiredConversations: 5,
        message: null,
        error: null,
      });
      
      return insight;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      throw err;
    }
  }, [cachedInsights]);

  const clearCache = useCallback(() => {
    setCachedInsights(new Map());
    setState({
      status: 'idle',
      insight: null,
      weeklyConversationCount: 0,
      requiredConversations: 5,
      message: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    loading: state.status === 'loading',
    data: state.insight,
    generateDeepInsight,
    clearCache,
  };
}

