import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isDeveloperEmail } from '@/constants/developerAccess';
import {
  DEEP_INSIGHT_TYPE,
  EXPLORE_INSIGHT_TYPES,
  type ExploreInsightType,
  type InsightUnlockProgress,
} from '@/types/insightUnlock.types';
import {
  buildInsightProgressMap,
  fetchInsightUnlockRules,
} from '@/utils/insightUnlock';
import {
  shouldSyncExploreInsights,
  syncExploreInsights,
  type StoredExploreInsight,
} from '@/utils/syncExploreInsights';

export interface Insight {
  title: string;
  description: string;
  loading?: boolean;
  error?: string;
  locked?: boolean;
  remaining?: number;
  contextSummary?: string;
  internalContext?: string;
  conversationId?: string;
  cycleProgress?: number;
  cycleRequired?: number;
}

export interface LoadExploreInsightsOptions {
  cacheOnly?: boolean;
  forceSync?: boolean;
}

const EMPTY_INSIGHT: Insight = {
  title: '',
  description: '',
  loading: true,
};

const LOGIN_MESSAGE: Insight = {
  title: 'Faça login para ver seus insights',
  description: 'Entre na sua conta para acessar insights personalizados.',
  loading: false,
};

function applyDeveloperAccess(insight: Insight, cycleRequired?: number): Insight {
  return {
    ...insight,
    locked: false,
    remaining: 0,
    ...(cycleRequired
      ? { cycleProgress: cycleRequired, cycleRequired }
      : {}),
  };
}

function buildInsightFromSources(
  progress: InsightUnlockProgress,
  ruleTitle: string,
  ruleDescription: string,
  storedInsight?: {
    title: string;
    description: string;
    locked: boolean | null;
    context_summary: string | null;
    internal_context: string | null;
    conversation_id: string | null;
  } | null,
): Insight {
  const locked = progress.locked;

  if (!locked && storedInsight && storedInsight.locked === false) {
    return {
      title: storedInsight.title,
      description: storedInsight.description,
      locked: false,
      remaining: 0,
      cycleProgress: progress.progress,
      cycleRequired: progress.required,
      contextSummary: storedInsight.context_summary ?? undefined,
      internalContext: storedInsight.internal_context ?? undefined,
      conversationId: storedInsight.conversation_id ?? undefined,
      loading: false,
    };
  }

  return {
    title: locked ? ruleTitle : storedInsight?.title || ruleTitle,
    description: locked ? ruleDescription : storedInsight?.description || ruleDescription,
    locked,
    remaining: progress.remaining,
    cycleProgress: progress.progress,
    cycleRequired: progress.required,
    contextSummary: storedInsight?.context_summary ?? undefined,
    internalContext: storedInsight?.internal_context ?? undefined,
    conversationId: storedInsight?.conversation_id ?? undefined,
    loading: false,
  };
}

export function useExploreInsights(refreshToken = 0) {
  const { user } = useAuth();
  const isDeveloper = isDeveloperEmail(user?.email);
  const hasLoadedOnceRef = useRef(false);

  const [yesterdayInsight, setYesterdayInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [generalInsight, setGeneralInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [frequencyInsight, setFrequencyInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [habitInsight, setHabitInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [deepInsightProgress, setDeepInsightProgress] = useState<InsightUnlockProgress>({
    conversationCount: 0,
    required: 5,
    remaining: 5,
    progress: 0,
    locked: true,
  });

  const applyInsightsFromDb = useCallback(async () => {
    if (!user) {
      return null;
    }

    const [rules, insightsResult] = await Promise.all([
      fetchInsightUnlockRules(),
      supabase
        .from('user_insights')
        .select(
          'insight_type, title, description, locked, context_summary, internal_context, conversation_id, generated_at, insight_date',
        )
        .eq('user_id', user.id)
        .in('insight_type', [...EXPLORE_INSIGHT_TYPES, DEEP_INSIGHT_TYPE]),
    ]);

    const progressMap = await buildInsightProgressMap(user.id, rules);
    const storedRows = insightsResult.data ?? [];
    const storedByType = new Map(storedRows.map((row) => [row.insight_type, row]));

    const ruleByType = new Map(rules.map((rule) => [rule.insight_type, rule]));
    const deepRule = ruleByType.get(DEEP_INSIGHT_TYPE);
    const deepProgress = progressMap[DEEP_INSIGHT_TYPE] ?? {
      conversationCount: 0,
      required: deepRule?.required_conversations ?? 5,
      remaining: deepRule?.required_conversations ?? 5,
      progress: 0,
      locked: true,
    };

    setDeepInsightProgress(
      isDeveloper
        ? {
            ...deepProgress,
            locked: false,
            remaining: 0,
            progress: deepProgress.required,
          }
        : deepProgress,
    );

    const buildForType = (insightType: ExploreInsightType) => {
      const rule = ruleByType.get(insightType);
      const progress = progressMap[insightType];
      if (!rule || !progress) {
        return { title: '', description: '', loading: false, locked: true };
      }

      const insight = buildInsightFromSources(
        progress,
        rule.locked_title,
        rule.locked_description,
        storedByType.get(insightType) ?? null,
      );

      return isDeveloper
        ? applyDeveloperAccess(insight, progress.required)
        : insight;
    };

    setYesterdayInsight(buildForType('yesterday_journey'));
    setGeneralInsight(buildForType('general_insight'));
    setFrequencyInsight(buildForType('frequency'));
    setHabitInsight(buildForType('habit'));

    return {
      storedRows: storedRows.map((row) => ({
        insight_type: row.insight_type,
        title: row.title,
        description: row.description,
        locked: row.locked,
        generated_at: row.generated_at,
        insight_date: row.insight_date,
      })) as StoredExploreInsight[],
      progressMap,
    };
  }, [isDeveloper, user]);

  const loadInsights = useCallback(
    async (options: LoadExploreInsightsOptions = {}) => {
      if (!user) {
        hasLoadedOnceRef.current = false;
        setYesterdayInsight(LOGIN_MESSAGE);
        setGeneralInsight(LOGIN_MESSAGE);
        setFrequencyInsight(LOGIN_MESSAGE);
        setHabitInsight(LOGIN_MESSAGE);
        setDeepInsightProgress({
          conversationCount: 0,
          required: 5,
          remaining: 5,
          progress: 0,
          locked: true,
        });
        return;
      }

      const showLoading = !hasLoadedOnceRef.current;
      if (showLoading) {
        setYesterdayInsight((prev) => ({ ...prev, loading: true }));
        setGeneralInsight((prev) => ({ ...prev, loading: true }));
        setFrequencyInsight((prev) => ({ ...prev, loading: true }));
        setHabitInsight((prev) => ({ ...prev, loading: true }));
      }

      try {
        const snapshot = await applyInsightsFromDb();
        hasLoadedOnceRef.current = true;

        if (options.cacheOnly || !snapshot) {
          return;
        }

        const needsSync =
          options.forceSync ||
          shouldSyncExploreInsights(snapshot.storedRows, snapshot.progressMap);

        if (!needsSync) {
          return;
        }

        void syncExploreInsights({ force: options.forceSync }).then(async () => {
          try {
            await applyInsightsFromDb();
          } catch (error) {
            console.error('Error refreshing explore insights after sync:', error);
          }
        });
      } catch (error) {
        console.error('Error loading explore insights:', error);
        const errorInsight: Insight = {
          title: 'Não foi possível carregar',
          description: 'Tente novamente em instantes.',
          loading: false,
          locked: true,
        };
        setYesterdayInsight(errorInsight);
        setGeneralInsight(errorInsight);
        setFrequencyInsight(errorInsight);
        setHabitInsight(errorInsight);
      }
    },
    [applyInsightsFromDb, user],
  );

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    void loadInsights();
  }, [loadInsights, refreshToken]);

  return {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
    deepInsightProgress,
    isLoading:
      yesterdayInsight.loading ||
      generalInsight.loading ||
      frequencyInsight.loading ||
      habitInsight.loading,
    refreshInsights: loadInsights,
  };
}
