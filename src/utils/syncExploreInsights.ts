import { supabase } from '@/integrations/supabase/client';
import {
  EXPLORE_INSIGHT_TYPES,
  type ExploreInsightType,
} from '@/types/insightUnlock.types';
import type { InsightUnlockProgress } from '@/types/insightUnlock.types';
import { getTodayInBrasilia } from '@/utils/dateUtils';

let syncInFlight: Promise<void> | null = null;
let lastSyncedAt = 0;
const MIN_SYNC_INTERVAL_MS = 4_000;

export interface StoredExploreInsight {
  insight_type: string;
  locked: boolean | null;
  generated_at: string | null;
  insight_date: string | null;
}

export interface SyncExploreInsightsOptions {
  force?: boolean;
  types?: ExploreInsightType[];
}

export function shouldSyncExploreInsights(
  storedRows: StoredExploreInsight[],
  progressMap: Record<string, InsightUnlockProgress>,
): boolean {
  const today = getTodayInBrasilia();
  const storedByType = new Map(storedRows.map((row) => [row.insight_type, row]));

  for (const insightType of EXPLORE_INSIGHT_TYPES) {
    const progress = progressMap[insightType];
    if (!progress) {
      continue;
    }

    const stored = storedByType.get(insightType);

    if (insightType === 'yesterday_journey') {
      if (!stored || stored.insight_date !== today) {
        return true;
      }
      if (!progress.locked && stored.locked !== false) {
        return true;
      }
      continue;
    }

    if (progress.locked) {
      continue;
    }

    if (!stored || stored.locked !== false) {
      return true;
    }

    const generatedDate = stored.generated_at?.split('T')[0];
    if (!generatedDate || generatedDate < today) {
      return true;
    }
  }

  return false;
}

export async function syncExploreInsights(
  options?: SyncExploreInsightsOptions,
): Promise<void> {
  const now = Date.now();
  const force = options?.force ?? false;

  if (syncInFlight) {
    return syncInFlight;
  }

  if (!force && now - lastSyncedAt < MIN_SYNC_INTERVAL_MS) {
    return;
  }

  syncInFlight = (async () => {
    try {
      const { error } = await supabase.functions.invoke('generate-insights', {
        body: options?.types?.length ? { types: options.types } : {},
      });

      if (error) {
        console.warn('Explore insights sync failed:', error.message);
        return;
      }

      lastSyncedAt = Date.now();
    } catch (error) {
      console.warn('Explore insights sync failed:', error);
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}
