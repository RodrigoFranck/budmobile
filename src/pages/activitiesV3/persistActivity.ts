import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import { clearMissingRelation, noteRelationError } from '@/lib/schemaAvailability';
import {
  ACTIVITY_CHIP_META,
  type HistoryActivityChip,
} from '@/hooks/useHistoryDays';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import { getTodayInBrasilia } from '@/utils/dateUtils';

export type PersistActivityParams = {
  userId: string;
  activityId: ActivityId;
  answers: Record<string, unknown>;
  resultText: string;
  feedback?: number | null;
};

type HistoryExtrasCache = {
  messageCounts: Record<string, number>;
  activityByDay: Record<string, HistoryActivityChip[]>;
  letterDays: string[];
  checkInDays: string[];
};

function primeHistoryActivity(
  userId: string,
  activityId: ActivityId,
  resultText: string,
) {
  const dayKey = getTodayInBrasilia();
  const meta = ACTIVITY_CHIP_META[activityId];
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
      if (existing.some((item) => item.id === activityId)) return extras;
      return {
        ...extras,
        activityByDay: {
          ...extras.activityByDay,
          [dayKey]: [
            ...existing,
            {
              id: activityId,
              label: meta.label,
              color: meta.color,
              resultText,
            },
          ],
        },
      };
    },
  );
}

export async function persistActivity(params: PersistActivityParams): Promise<boolean> {
  const responses = {
    ...params.answers,
    ...(params.feedback != null ? { feedback: params.feedback } : {}),
  } as Json;

  const { error } = await supabase.from('activity_sessions').insert({
    user_id: params.userId,
    activity_type: params.activityId,
    status: 'completed',
    responses,
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
  primeHistoryActivity(params.userId, params.activityId, params.resultText);
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
