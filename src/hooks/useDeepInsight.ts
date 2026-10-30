import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBrasilia, getWeekStartBrasilia } from "@/utils/dateUtils";

export interface DeepInsight {
  headline: string;
  intro: string;
  themes?: string[];
  quote?: string;
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
  | 'available_on_sunday'
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

const DEFAULT_REQUIRED_CONVERSATIONS = 2;

const LOADED_STATE = {
  status: 'loaded' as const,
  weeklyConversationCount: DEFAULT_REQUIRED_CONVERSATIONS,
  requiredConversations: DEFAULT_REQUIRED_CONVERSATIONS,
  message: null,
  error: null,
};

export function areDeepInsightsEquivalent(left: DeepInsight | null, right: DeepInsight): boolean {
  if (left === right) return true;
  if (!left) return false;

  return (
    left.headline === right.headline &&
    left.intro === right.intro &&
    left.quote === right.quote &&
    left.what_i_noticed?.content === right.what_i_noticed?.content &&
    left.reflection?.content === right.reflection?.content &&
    left.key_takeaway?.content === right.key_takeaway?.content &&
    left.next_steps?.content === right.next_steps?.content
  );
}

function resolveWeekStartStr(weekStart?: Date | string): string {
  if (typeof weekStart === 'string' && weekStart) {
    return weekStart;
  }

  return formatDateBrasilia(
    weekStart instanceof Date ? getWeekStartBrasilia(weekStart) : getWeekStartBrasilia(),
  );
}

async function resolveFunctionsError(
  error: { message?: string; context?: unknown } | null,
  response?: Response | null,
): Promise<string> {
  const fallback = error?.message || 'Erro ao gerar insight aprofundado';
  const errorContext =
    response
    ?? (
      typeof error === 'object'
      && error !== null
      && 'context' in error
      && error.context instanceof Response
        ? error.context
        : null
    );

  if (!errorContext) {
    return fallback;
  }

  try {
    const body = (await errorContext.clone().json()) as {
      error?: string;
      message?: string;
      status?: string;
    };
    if (body.error) {
      return body.error;
    }
    if (body.message) {
      return body.message;
    }
  } catch {
    // keep default message
  }

  if (fallback.includes('non-2xx')) {
    return 'Não foi possível gerar o insight agora. Tente novamente em instantes.';
  }

  return fallback;
}

export function useDeepInsight() {
  const [state, setState] = useState<DeepInsightState>({
    status: 'idle',
    insight: null,
    weeklyConversationCount: 0,
    requiredConversations: DEFAULT_REQUIRED_CONVERSATIONS,
    message: null,
    error: null,
  });

  const cachedInsightsRef = useRef<Map<string, DeepInsight>>(new Map());
  const inFlightWeekRef = useRef<string | null>(null);

  const applyLoadedInsight = useCallback((insight: DeepInsight) => {
    setState((prev) => {
      if (prev.status === 'loaded' && areDeepInsightsEquivalent(prev.insight, insight)) {
        return prev;
      }

      return {
        ...LOADED_STATE,
        insight,
      };
    });
  }, []);

  const hydrateInsight = useCallback((insight: DeepInsight, weekStart?: Date | string) => {
    const weekStartStr = resolveWeekStartStr(weekStart);
    cachedInsightsRef.current.set(weekStartStr, insight);
    applyLoadedInsight(insight);
  }, [applyLoadedInsight]);

  const generateDeepInsight = useCallback(async (
    weekStart?: Date | string,
    options?: { force?: boolean },
  ): Promise<DeepInsight | null> => {
    const weekStartStr = resolveWeekStartStr(weekStart);
    const cached = cachedInsightsRef.current.get(weekStartStr);

    if (cached && !options?.force) {
      applyLoadedInsight(cached);
      return cached;
    }

    if (inFlightWeekRef.current === weekStartStr) {
      return cached ?? null;
    }

    inFlightWeekRef.current = weekStartStr;
    setState((prev) => {
      if (prev.status === 'loaded' && prev.insight) {
        return { ...prev, error: null };
      }
      return { ...prev, status: 'loading', error: null };
    });

    try {
      const { data: functionData, error: functionError, response } = await supabase.functions.invoke(
        'generate-deep-insight',
        {
          body: { week_start: weekStartStr },
        }
      );

      if (functionError) {
        const message = await resolveFunctionsError(functionError, response);
        console.error('Error generating deep insight:', message);
        setState(prev => ({
          ...prev,
          status: 'error',
          error: message,
        }));
        return null;
      }

      if (functionData?.status === 'insufficient_conversations') {
        setState({
          status: 'insufficient_conversations',
          insight: null,
          weeklyConversationCount: functionData.current || 0,
          requiredConversations: functionData.required || DEFAULT_REQUIRED_CONVERSATIONS,
          message: functionData.message,
          error: null,
        });
        return null;
      }

      if (functionData?.status === 'available_on_sunday') {
        setState({
          status: 'available_on_sunday',
          insight: null,
          weeklyConversationCount: functionData.current || 0,
          requiredConversations: functionData.required || DEFAULT_REQUIRED_CONVERSATIONS,
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
          requiredConversations: DEFAULT_REQUIRED_CONVERSATIONS,
          message: functionData.message,
          error: null,
        });
        return null;
      }

      if (functionData?.error) {
        const message = functionData.message || 'Erro ao gerar insight';
        setState(prev => ({
          ...prev,
          status: 'error',
          error: message,
        }));
        return null;
      }

      const insight = functionData as DeepInsight;
      if (!insight?.headline || !insight?.intro) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Não foi possível gerar o insight agora. Tente novamente em instantes.',
        }));
        return null;
      }

      cachedInsightsRef.current.set(weekStartStr, insight);
      applyLoadedInsight(insight);

      return insight;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage.includes('non-2xx')
          ? 'Não foi possível gerar o insight agora. Tente novamente em instantes.'
          : errorMessage,
      }));
      return null;
    } finally {
      if (inFlightWeekRef.current === weekStartStr) {
        inFlightWeekRef.current = null;
      }
    }
  }, [applyLoadedInsight]);

  const clearCache = useCallback(() => {
    cachedInsightsRef.current = new Map();
    setState({
      status: 'idle',
      insight: null,
      weeklyConversationCount: 0,
      requiredConversations: DEFAULT_REQUIRED_CONVERSATIONS,
      message: null,
      error: null,
    });
  }, []);

  const resetTransientState = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'loaded' && prev.insight) {
        return prev;
      }

      return {
        ...prev,
        status: 'idle',
        error: null,
        message: null,
      };
    });
  }, []);

  return {
    ...state,
    loading: state.status === 'loading',
    data: state.insight,
    generateDeepInsight,
    hydrateInsight,
    clearCache,
    resetTransientState,
  };
}
