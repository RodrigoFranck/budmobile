import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import { clearMissingRelation, noteRelationError } from '@/lib/schemaAvailability';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import { getTodayInBrasilia } from '@/utils/dateUtils';

export type PersistActivityParams = {
  userId: string;
  activityId: ActivityId;
  answers: Record<string, string>;
  resultText: string;
};

type HistoryExtrasCache = {
  messageCounts: Record<string, number>;
  activityByDay: Record<string, ActivityId[]>;
  letterDays: string[];
  checkInDays: string[];
};

function primeHistoryActivity(userId: string, activityId: ActivityId) {
  const dayKey = getTodayInBrasilia();
  queryClient.setQueriesData<HistoryExtrasCache>(
    { queryKey: queryKeys.historyDays(userId) },
    (current) => {
      const extras = current ?? {
        messageCounts: {},
        activityByDay: {},
        letterDays: [],
        checkInDays: [],
      };
      const existing = extras.activityByDay[dayKey] ?? [];
      if (existing.includes(activityId)) return extras;
      return {
        ...extras,
        activityByDay: {
          ...extras.activityByDay,
          [dayKey]: [...existing, activityId],
        },
      };
    },
  );
}

export async function persistActivity(params: PersistActivityParams): Promise<boolean> {
  const { error } = await supabase.from('activity_sessions').insert({
    user_id: params.userId,
    activity_type: params.activityId,
    status: 'completed',
    responses: params.answers,
    result_text: params.resultText,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    if (!noteRelationError('activity_sessions', error)) {
      console.error('Error persisting activity:', error);
    }
    return false;
  }

  clearMissingRelation('activity_sessions');
  primeHistoryActivity(params.userId, params.activityId);
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.declaredUserContext(params.userId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.historyDays(params.userId),
      refetchType: 'none',
    }),
  ]);
  return true;
}

export function createActivityPersister() {
  let saved = false;
  let inflight: Promise<boolean> | null = null;

  return async (params: PersistActivityParams) => {
    if (saved) return true;
    if (inflight) return inflight;
    inflight = persistActivity(params)
      .then((ok) => {
        if (ok) saved = true;
        return ok;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}
