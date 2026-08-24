import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isDeveloperEmail } from '@/constants/developerAccess';
import {
  fetchUserInsights,
} from '@/hooks/useUserInsightsQuery';
import { queryKeys } from '@/lib/queryKeys';
import {
  DEEP_INSIGHT_TYPE,
  type ExploreInsightType,
  type InsightUnlockProgress,
} from '@/types/insightUnlock.types';
import {
  buildInsightProgressMap,
  fetchInsightUnlockRules,
} from '@/utils/insightUnlock';
import {
  formatDateBrasilia,
  getTodayInBrasilia,
  getWeekStartBrasilia,
} from '@/utils/dateUtils';
import {
  shouldSyncExploreInsights,
  syncExploreInsights,
  type StoredExploreInsight,
} from '@/utils/syncExploreInsights';
import type { DeepInsight } from '@/hooks/useDeepInsight';

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

const DEEP_UNLOCKED_PLACEHOLDER: Insight = {
  title: 'Inspirado em você',
  description: 'Toque para ler seu insight semanal.',
  locked: false,
  remaining: 0,
  loading: false,
};

function isDeepInsightContent(value: unknown): value is DeepInsight {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Partial<DeepInsight>;
  return typeof content.headline === 'string' && typeof content.intro === 'string';
}

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

function isUsableStoredInsight(
  storedInsight:
    | {
        locked: boolean | null;
        insight_date?: string | null;
      }
    | null
    | undefined,
  requireInsightDate?: string,
): boolean {
  if (!storedInsight || storedInsight.locked !== false) {
    return false;
  }

  if (requireInsightDate && storedInsight.insight_date !== requireInsightDate) {
    return false;
  }

  return true;
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
    insight_date?: string | null;
  } | null,
  requireInsightDate?: string,
): Insight {
  const storedUsable = isUsableStoredInsight(storedInsight, requireInsightDate);

  if (!progress.locked && storedUsable && storedInsight) {
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
    title: ruleTitle,
    description: ruleDescription,
    locked: true,
    remaining: progress.remaining,
    cycleProgress: progress.progress,
    cycleRequired: progress.required,
    loading: false,
  };
}

export function useExploreInsights(refreshToken = 0) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDeveloper = isDeveloperEmail(user?.email);
  const hasLoadedOnceRef = useRef(false);

  const [yesterdayInsight, setYesterdayInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [generalInsight, setGeneralInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [frequencyInsight, setFrequencyInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [habitInsight, setHabitInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [deepInsight, setDeepInsight] = useState<Insight>(EMPTY_INSIGHT);
  const [deepInsightContent, setDeepInsightContent] = useState<DeepInsight | null>(null);
  const [deepInsightProgress, setDeepInsightProgress] = useState<InsightUnlockProgress>({
    conversationCount: 0,
    required: 2,
    remaining: 2,
    progress: 0,
    locked: true,
  });
  const deepSyncInFlightRef = useRef(false);

  const applyInsightsFromDb = useCallback(async () => {
    if (!user?.id) {
      return null;
    }

    const weekStartStr = formatDateBrasilia(getWeekStartBrasilia());

    const [rules, storedRows] = await Promise.all([
      fetchInsightUnlockRules(),
      queryClient.fetchQuery({
        queryKey: queryKeys.userInsights(user.id),
        queryFn: () => fetchUserInsights(user.id),
      }),
    ]);

    const progressMap = await buildInsightProgressMap(user.id, rules);
    const storedByType = new Map(
      storedRows
        .filter((row) => row.insight_type !== DEEP_INSIGHT_TYPE)
        .map((row) => [row.insight_type, row]),
    );

    const ruleByType = new Map(rules.map((rule) => [rule.insight_type, rule]));
    const deepRule = ruleByType.get(DEEP_INSIGHT_TYPE);
    const deepProgress = progressMap[DEEP_INSIGHT_TYPE] ?? {
      conversationCount: 0,
      required: deepRule?.required_conversations ?? 2,
      remaining: deepRule?.required_conversations ?? 2,
      progress: 0,
      locked: true,
    };

    const effectiveDeepProgress = isDeveloper
      ? {
          ...deepProgress,
          locked: false,
          remaining: 0,
          progress: deepProgress.required,
        }
      : deepProgress;

    setDeepInsightProgress(effectiveDeepProgress);

    const deepStored =
      storedRows.find(
        (row) =>
          row.insight_type === DEEP_INSIGHT_TYPE &&
          row.week_start === weekStartStr &&
          row.locked === false &&
          !!row.title,
      ) ?? null;

    if (deepStored && isDeepInsightContent(deepStored.content_json)) {
      setDeepInsightContent(deepStored.content_json);
    } else {
      setDeepInsightContent(null);
    }

    if (effectiveDeepProgress.locked) {
      setDeepInsight({
        title: deepRule?.locked_title ?? 'Inspirado em você',
        description:
          deepRule?.locked_description ??
          'Converse ou faça check-ins em 2 dias nesta semana. Seu insight semanal é liberado todo domingo.',
        locked: true,
        remaining: effectiveDeepProgress.remaining,
        cycleProgress: effectiveDeepProgress.progress,
        cycleRequired: effectiveDeepProgress.required,
        loading: false,
      });
    } else if (deepStored) {
      setDeepInsight({
        title: deepStored.title,
        description: deepStored.description,
        locked: false,
        remaining: 0,
        cycleProgress: effectiveDeepProgress.progress,
        cycleRequired: effectiveDeepProgress.required,
        contextSummary: deepStored.context_summary ?? undefined,
        internalContext: deepStored.internal_context ?? undefined,
        loading: false,
      });
    } else {
      setDeepInsight({
        ...DEEP_UNLOCKED_PLACEHOLDER,
        cycleProgress: effectiveDeepProgress.progress,
        cycleRequired: effectiveDeepProgress.required,
      });
    }

    const today = getTodayInBrasilia();

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
        insightType === 'yesterday_journey' ? today : undefined,
      );

      if (isDeveloper && !(insightType === 'yesterday_journey' && insight.locked)) {
        return applyDeveloperAccess(insight, progress.required);
      }

      return insight;
    };

    setYesterdayInsight(buildForType('yesterday_journey'));
    setGeneralInsight(buildForType('general_insight'));
    setFrequencyInsight(buildForType('frequency'));
    setHabitInsight(buildForType('habit'));

    return {
      storedRows: storedRows as StoredExploreInsight[],
      progressMap,
      weekStartStr,
      deepUnlocked: !effectiveDeepProgress.locked,
      hasDeepContent: !!deepStored,
    };
  }, [isDeveloper, queryClient, user?.id]);

  const syncDeepInsightIfNeeded = useCallback(
    async (weekStartStr: string) => {
      if (deepSyncInFlightRef.current || !user?.id) {
        return;
      }

      deepSyncInFlightRef.current = true;
      try {
        const { error } = await supabase.functions.invoke('generate-deep-insight', {
          body: { week_start: weekStartStr },
        });

        if (error) {
          console.warn('Deep insight sync failed:', error.message);
          return;
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.userInsights(user.id) });
        await applyInsightsFromDb();
      } catch (error) {
        console.warn('Deep insight sync failed:', error);
      } finally {
        deepSyncInFlightRef.current = false;
      }
    },
    [applyInsightsFromDb, queryClient, user?.id],
  );

  const loadInsights = useCallback(
    async (options: LoadExploreInsightsOptions = {}) => {
      if (!user?.id) {
        hasLoadedOnceRef.current = false;
        setYesterdayInsight(LOGIN_MESSAGE);
        setGeneralInsight(LOGIN_MESSAGE);
        setFrequencyInsight(LOGIN_MESSAGE);
        setHabitInsight(LOGIN_MESSAGE);
        setDeepInsight(LOGIN_MESSAGE);
        setDeepInsightContent(null);
        setDeepInsightProgress({
          conversationCount: 0,
          required: 2,
          remaining: 2,
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
        setDeepInsight((prev) => ({ ...prev, loading: true }));
      }

      try {
        const snapshot = await applyInsightsFromDb();
        hasLoadedOnceRef.current = true;

        if (!snapshot) {
          return;
        }

        if (snapshot.deepUnlocked && !snapshot.hasDeepContent) {
          void syncDeepInsightIfNeeded(snapshot.weekStartStr);
        }

        const needsSync =
          options.forceSync ||
          shouldSyncExploreInsights(snapshot.storedRows, snapshot.progressMap);

        if (!needsSync) {
          return;
        }

        void syncExploreInsights({ force: options.forceSync }).then(async () => {
          try {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.userInsights(user.id),
            });
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
        setDeepInsight(errorInsight);
        setDeepInsightContent(null);
      }
    },
    [applyInsightsFromDb, queryClient, syncDeepInsightIfNeeded, user?.id],
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
    deepInsight,
    deepInsightContent,
    deepInsightProgress,
    isLoading:
      yesterdayInsight.loading ||
      generalInsight.loading ||
      frequencyInsight.loading ||
      habitInsight.loading ||
      deepInsight.loading,
    refreshInsights: loadInsights,
  };
}
