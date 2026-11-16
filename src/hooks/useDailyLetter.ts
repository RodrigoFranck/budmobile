import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchStoredDailyLetter,
  markStoredDailyLetterOpened,
  requestGeneratedDailyLetter,
} from '@/services/dailyLetterQuery';
import { conversationDayKey } from '@/utils/homeRecaps';
import { resolveDailyLetter, type StoredDailyLetter } from '@/utils/dailyLetter';
import { getTodayInBrasilia, getYesterdayInBrasilia } from '@/utils/dateUtils';
import { bootMarkOnce } from '@/utils/bootTiming';

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
  const {
    yesterdayInsight,
    conversations,
    insightsLoading,
    conversationsLoading,
  } = useTabScreenContext();
  const queryClient = useQueryClient();
  const today = getTodayInBrasilia();
  const yesterday = getYesterdayInBrasilia();
  const userId = user?.id;
  // Do not wait for history title AI — only the conversations list matters here.
  const conversationsReady = !conversationsLoading;
  const hadYesterdayConversation = hadConversationOn(conversations, yesterday);
  const queryKey = useMemo(
    () => [...queryKeys.dailyLetter(userId ?? '', today), hadYesterdayConversation] as const,
    [hadYesterdayConversation, today, userId],
  );

  const storedQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const started = Date.now();
      const letter = await fetchStoredDailyLetter(userId!, today);
      bootMarkOnce('home_letter_stored_done', {
        ms: Date.now() - started,
        hasLetter: Boolean(letter),
      });
      return letter;
    },
    enabled: Boolean(userId) && conversationsReady,
    staleTime: Infinity,
  });

  const generateQuery = useQuery({
    queryKey: [...queryKey, 'generate'],
    queryFn: async () => {
      const started = Date.now();
      bootMarkOnce('home_letter_ai_start');
      const letter = await requestGeneratedDailyLetter();
      bootMarkOnce('home_letter_ai_done', {
        ms: Date.now() - started,
        hasLetter: Boolean(letter),
      });
      if (letter) {
        queryClient.setQueryData(queryKey, letter);
      }
      return letter;
    },
    enabled:
      Boolean(userId) &&
      conversationsReady &&
      storedQuery.isFetched &&
      !storedQuery.data &&
      hadYesterdayConversation,
    staleTime: Infinity,
    retry: false,
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

  const storedLetter = storedQuery.data ?? generateQuery.data ?? null;

  const resolved = useMemo(
    () =>
      resolveDailyLetter({
        today,
        hadYesterdayConversation,
        stored: storedLetter,
        insight: storedQuery.isFetched && !storedLetter ? yesterdayInsight : undefined,
        openedAt: storedLetter?.opened_at ?? openedQuery.data ?? null,
      }),
    [
      hadYesterdayConversation,
      openedQuery.data,
      storedLetter,
      storedQuery.isFetched,
      today,
      yesterdayInsight,
    ],
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

  const waitingInsightFallback =
    storedQuery.isFetched &&
    !storedLetter &&
    hadYesterdayConversation &&
    insightsLoading &&
    !generateQuery.isFetching;

  const generating =
    Boolean(userId) &&
    hadYesterdayConversation &&
    storedQuery.isFetched &&
    !storedQuery.data &&
    (generateQuery.isPending || generateQuery.isFetching) &&
    !generateQuery.isFetched;

  return {
    letter: resolved.letter,
    available: resolved.available,
    hadYesterdayConversation,
    loading:
      Boolean(userId) &&
      (!conversationsReady || !storedQuery.isFetched || waitingInsightFallback),
    generating,
    markOpened,
    refetch,
  };
}
