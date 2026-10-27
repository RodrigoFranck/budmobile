import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { queryKeys } from '@/lib/queryKeys';
import { getTodayInBrasilia } from '@/utils/dateUtils';

export type DailyLetter = {
  id: string;
  letter_date: string;
  title: string;
  body: string;
  opened_at: string | null;
};

const composedCache = new Map<string, { title: string; body: string }>();

function composeLetter(params: {
  name: string | null;
  yesterdayTitle?: string | null;
  yesterdayBody?: string | null;
}): { title: string; body: string } {
  const firstName = params.name?.split(' ')[0] ?? 'você';
  if (params.yesterdayBody) {
    return {
      title: 'Você não precisa resolver tudo hoje',
      body: params.yesterdayBody,
    };
  }
  if (params.yesterdayTitle) {
    return {
      title: 'O que ficou de ontem',
      body: `${firstName}, ontem você esteve em “${params.yesterdayTitle}”. Hoje pode ser um dia mais leve — sem a obrigação de encerrar a lista.`,
    };
  }
  return {
    title: 'Você não precisa resolver tudo hoje',
    body: `${firstName}, a carta de hoje é um convite para respirar. O que importa agora cabe em um passo pequeno.`,
  };
}

function openedStorageKey(userId: string, date: string) {
  return `daily_letter_opened_${userId}_${date}`;
}

function compositionKey(userId: string, date: string) {
  return `${userId}:${date}`;
}

async function loadDailyLetter(params: {
  userId: string;
  today: string;
  name: string | null;
  yesterdayTitle?: string | null;
  yesterdayBody?: string | null;
}): Promise<DailyLetter> {
  const cacheKey = compositionKey(params.userId, params.today);
  let composed = composedCache.get(cacheKey);
  if (!composed) {
    composed = composeLetter({
      name: params.name,
      yesterdayTitle: params.yesterdayTitle,
      yesterdayBody: params.yesterdayBody,
    });
    composedCache.set(cacheKey, composed);
  }

  let openedAt: string | null = null;
  try {
    openedAt = (await SecureStore.getItemAsync(openedStorageKey(params.userId, params.today))) ?? null;
  } catch {
    openedAt = null;
  }

  return {
    id: `local-${params.today}`,
    letter_date: params.today,
    title: composed.title,
    body: composed.body,
    opened_at: openedAt,
  };
}

export function useDailyLetter() {
  const { user } = useAuth();
  const { yesterdayInsight, profile, insightsLoading, profileLoading } = useTabScreenContext();
  const queryClient = useQueryClient();
  const today = getTodayInBrasilia();
  const userId = user?.id;
  const queryKey = useMemo(
    () => queryKeys.dailyLetter(userId ?? '', today),
    [today, userId],
  );

  const { data: letter, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      loadDailyLetter({
        userId: userId!,
        today,
        name: profile?.name ?? null,
        yesterdayTitle: yesterdayInsight?.title,
        yesterdayBody: yesterdayInsight?.description,
      }),
    enabled: Boolean(userId) && !profileLoading && !insightsLoading,
  });

  const markOpened = useCallback(async () => {
    if (!userId) {
      return;
    }
    const current = queryClient.getQueryData<DailyLetter>(queryKey);
    if (current?.opened_at) {
      return;
    }
    const openedAt = new Date().toISOString();
    if (current) {
      queryClient.setQueryData<DailyLetter>(queryKey, {
        ...current,
        opened_at: openedAt,
      });
    }
    try {
      await SecureStore.setItemAsync(openedStorageKey(userId, today), openedAt);
    } catch {
      // Keep the in-memory opened state even if persistence fails.
    }
  }, [queryClient, queryKey, today, userId]);

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    letter: letter ?? null,
    loading: Boolean(userId) && (isLoading || profileLoading || insightsLoading),
    markOpened,
    refetch,
  };
}
