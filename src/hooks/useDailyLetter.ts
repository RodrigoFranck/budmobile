import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchStoredDailyLetter,
  markStoredDailyLetterOpened,
} from '@/services/dailyLetterQuery';
import { conversationDayKey } from '@/utils/homeRecaps';
import { resolveDailyLetter, type StoredDailyLetter } from '@/utils/dailyLetter';
import { getTodayInBrasilia, getYesterdayInBrasilia } from '@/utils/dateUtils';

export type DailyLetter = StoredDailyLetter;

function openedStorageKey(userId: string, date: string) {
  return `daily_letter_opened_${userId}_${date}`;
}

function hadConversationOn(conversations: { conversation_date: string | null; created_at: string }[], day: string) {
  return conversations.some((conversation) => {
    return conversationDayKey(conversation.conversation_date || conversation.created_at) === day;
  });
}

export function useDailyLetter() {
  const { user } = useAuth();
  const { yesterdayInsight, conversations, insightsLoading, profileLoading, conversationsLoading } =
    useTabScreenContext();
  const queryClient = useQueryClient();
  const today = getTodayInBrasilia();
  const yesterday = getYesterdayInBrasilia();
  const userId = user?.id;
  const hadYesterdayConversation = hadConversationOn(conversations, yesterday);
  const queryKey = useMemo(
    () => queryKeys.dailyLetter(userId ?? '', today),
    [today, userId],
  );

  const storedQuery = useQuery({
    queryKey,
    queryFn: () => fetchStoredDailyLetter(userId!, today),
    enabled: Boolean(userId) && !profileLoading && !insightsLoading && !conversationsLoading,
  });

  const openedQuery = useQuery({
    queryKey: [...queryKey, 'opened'],
    queryFn: async () => {
      try {
        return (await SecureStore.getItemAsync(openedStorageKey(userId!, today))) ?? null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(userId),
  });

  const resolved = useMemo(
    () =>
      resolveDailyLetter({
        today,
        hadYesterdayConversation,
        stored: storedQuery.data ?? null,
        insight: yesterdayInsight,
        openedAt: storedQuery.data?.opened_at ?? openedQuery.data ?? null,
      }),
    [hadYesterdayConversation, openedQuery.data, storedQuery.data, today, yesterdayInsight],
  );

  const markOpened = useCallback(async () => {
    if (!userId || !resolved.letter || resolved.letter.opened_at) {
      return;
    }
    const openedAt = new Date().toISOString();
    const next: DailyLetter = { ...resolved.letter, opened_at: openedAt };
    queryClient.setQueryData<StoredDailyLetter | null>(queryKey, (current) =>
      current ? { ...current, opened_at: openedAt } : current,
    );
    queryClient.setQueryData([...queryKey, 'opened'], openedAt);
    try {
      await SecureStore.setItemAsync(openedStorageKey(userId, today), openedAt);
    } catch {
      // Keep the in-memory opened state even if persistence fails.
    }
    if (!next.id.startsWith('insight-') && !next.id.startsWith('local-')) {
      await markStoredDailyLetterOpened(next.id, openedAt);
    }
  }, [queryClient, queryKey, resolved.letter, today, userId]);

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    letter: resolved.letter,
    available: resolved.available,
    hadYesterdayConversation,
    loading: Boolean(userId) && (storedQuery.isLoading || profileLoading || insightsLoading || conversationsLoading),
    markOpened,
    refetch,
  };
}
