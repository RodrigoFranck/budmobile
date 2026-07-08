import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBrasilia, getWeekStartBrasilia } from "@/utils/dateUtils";
import { deepInsightNeedsVoiceRefresh } from "@/utils/insightVoice";

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

export function getDeepInsightWeekStart(date?: Date): string {
  return formatDateBrasilia(getWeekStartBrasilia(date));
}

function isDeepInsightContent(value: unknown): value is DeepInsight {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as DeepInsight;
  return Boolean(
    candidate.headline?.trim() &&
      candidate.intro?.trim() &&
      candidate.what_i_noticed?.title &&
      candidate.what_i_noticed?.content &&
      candidate.reflection?.title &&
      candidate.reflection?.content &&
      candidate.key_takeaway?.title &&
      candidate.key_takeaway?.content &&
      candidate.next_steps?.title &&
      candidate.next_steps?.content,
  );
}

const memoryCache = new Map<string, DeepInsight>();

type DeepInsightSession = {
  weekStart: string;
  state: DeepInsightState;
};

let session: DeepInsightSession | null = null;

function buildLoadedState(insight: DeepInsight): DeepInsightState {
  return {
    status: 'loaded',
    insight,
    weeklyConversationCount: 5,
    requiredConversations: 5,
    message: null,
    error: null,
  };
}

function getInitialState(): DeepInsightState {
  const weekStart = getDeepInsightWeekStart();

  if (session?.weekStart === weekStart && session.state.status === 'loaded' && session.state.insight) {
    return session.state;
  }

  const cached = memoryCache.get(weekStart);
  if (cached) {
    return buildLoadedState(cached);
  }

  return {
    status: 'idle',
    insight: null,
    weeklyConversationCount: 0,
    requiredConversations: 5,
    message: null,
    error: null,
  };
}

function persistSession(weekStart: string, nextState: DeepInsightState) {
  session = { weekStart, state: nextState };
  if (nextState.insight) {
    memoryCache.set(weekStart, nextState.insight);
  }
}

async function loadDeepInsightFromDb(weekStart: string): Promise<DeepInsight | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_insights")
    .select("content_json, locked")
    .eq("user_id", user.id)
    .eq("insight_type", "deep_insight")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error || !data || data.locked !== false || !data.content_json) {
    return null;
  }

  if (!isDeepInsightContent(data.content_json)) {
    return null;
  }

  if (deepInsightNeedsVoiceRefresh(data.content_json)) {
    return null;
  }

  return data.content_json;
}

export function useDeepInsight() {
  const [state, setState] = useState<DeepInsightState>(getInitialState);
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const inFlightRef = useRef<string | null>(null);

  const applyState = useCallback((weekStart: string, nextState: DeepInsightState) => {
    persistSession(weekStart, nextState);
    setState(nextState);
  }, []);

  const generateDeepInsight = useCallback(async (weekStart?: string): Promise<DeepInsight | null> => {
    const weekStartStr = weekStart ?? getDeepInsightWeekStart();

    if (inFlightRef.current === weekStartStr) {
      return state.insight;
    }

    const memoryCached = memoryCache.get(weekStartStr);
    if (memoryCached) {
      setShowLoadingUI(false);
      applyState(weekStartStr, buildLoadedState(memoryCached));
      return memoryCached;
    }

    if (session?.weekStart === weekStartStr && session.state.status === 'loaded' && session.state.insight) {
      setShowLoadingUI(false);
      setState(session.state);
      return session.state.insight;
    }

    inFlightRef.current = weekStartStr;

    try {
      const dbCached = await loadDeepInsightFromDb(weekStartStr);
      if (dbCached) {
        setShowLoadingUI(false);
        applyState(weekStartStr, buildLoadedState(dbCached));
        return dbCached;
      }

      setShowLoadingUI(true);
      applyState(weekStartStr, {
        status: 'loading',
        insight: null,
        weeklyConversationCount: 0,
        requiredConversations: 5,
        message: null,
        error: null,
      });

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

      if (functionData?.status === 'insufficient_conversations') {
        setShowLoadingUI(false);
        const nextState: DeepInsightState = {
          status: 'insufficient_conversations',
          insight: null,
          weeklyConversationCount: functionData.current || 0,
          requiredConversations: functionData.required || 5,
          message: functionData.message,
          error: null,
        };
        applyState(weekStartStr, nextState);
        return null;
      }

      if (functionData?.status === 'no_insight_for_week') {
        setShowLoadingUI(false);
        const nextState: DeepInsightState = {
          status: 'no_insight_for_week',
          insight: null,
          weeklyConversationCount: 0,
          requiredConversations: 5,
          message: functionData.message,
          error: null,
        };
        applyState(weekStartStr, nextState);
        return null;
      }

      if (functionData?.error) {
        throw new Error(functionData.message || 'Erro ao gerar insight');
      }

      if (!isDeepInsightContent(functionData)) {
        throw new Error('Resposta invalida ao gerar insight aprofundado');
      }

      const insight = functionData;

      setShowLoadingUI(false);
      applyState(weekStartStr, buildLoadedState(insight));
      return insight;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setShowLoadingUI(false);
      applyState(weekStartStr, {
        status: 'error',
        insight: null,
        weeklyConversationCount: 0,
        requiredConversations: 5,
        message: null,
        error: errorMessage,
      });
      throw err;
    } finally {
      if (inFlightRef.current === weekStartStr) {
        inFlightRef.current = null;
      }
    }
  }, [applyState, state.insight]);

  const clearCache = useCallback(() => {
    memoryCache.clear();
    session = null;
    setShowLoadingUI(false);
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
    showLoadingUI,
    data: state.insight,
    generateDeepInsight,
    clearCache,
  };
}
