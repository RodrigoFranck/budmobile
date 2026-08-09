import { useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  EXPLORE_INSIGHT_COUNT,
  EXPLORE_INSIGHT_KEYS,
  type ExploreInsightKey,
} from '@/constants/exploreInsights';
import { getTodayInBrasilia } from '@/utils/dateUtils';

const STORAGE_KEY_PREFIX = 'explore_viewed_insights_';

function isExploreInsightKey(value: string): value is ExploreInsightKey {
  return (EXPLORE_INSIGHT_KEYS as readonly string[]).includes(value);
}

function storageKeyForToday(today = getTodayInBrasilia()) {
  return `${STORAGE_KEY_PREFIX}${today}`;
}

export function useExploreViewedInsights() {
  const [viewedKeys, setViewedKeys] = useState<Set<ExploreInsightKey>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const today = getTodayInBrasilia();

  useEffect(() => {
    let cancelled = false;

    void SecureStore.getItemAsync(storageKeyForToday(today))
      .then((raw) => {
        if (cancelled) {
          return;
        }

        if (!raw) {
          setViewedKeys(new Set());
          setLoaded(true);
          return;
        }

        try {
          const parsed = JSON.parse(raw) as unknown;
          const keys = Array.isArray(parsed)
            ? parsed.filter((item): item is ExploreInsightKey =>
                typeof item === 'string' && isExploreInsightKey(item),
              )
            : [];
          setViewedKeys(new Set(keys));
        } catch {
          setViewedKeys(new Set());
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setViewedKeys(new Set());
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [today]);

  const persist = useCallback(
    (next: Set<ExploreInsightKey>) => {
      void SecureStore.setItemAsync(
        storageKeyForToday(today),
        JSON.stringify(Array.from(next)),
      );
    },
    [today],
  );

  const markInsightViewed = useCallback(
    (key: ExploreInsightKey) => {
      setViewedKeys((current) => {
        if (current.has(key)) {
          return current;
        }
        const next = new Set(current);
        next.add(key);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const unviewedInsightsCount = useMemo(() => {
    if (!loaded) {
      return 0;
    }
    return EXPLORE_INSIGHT_KEYS.filter((key) => !viewedKeys.has(key)).length;
  }, [loaded, viewedKeys]);

  return {
    loaded,
    viewedKeys,
    markInsightViewed,
    unviewedInsightsCount,
    totalInsightsCount: EXPLORE_INSIGHT_COUNT,
  };
}
