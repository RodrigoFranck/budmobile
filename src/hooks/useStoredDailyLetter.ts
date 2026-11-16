import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { fetchStoredDailyLetter } from '@/services/dailyLetterQuery';
import type { StoredDailyLetter } from '@/utils/dailyLetter';

/** Carta já gravada para uma data (histórico / reabertura). Não gera carta nova. */
export function useStoredDailyLetter(letterDate: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: queryKeys.dailyLetter(userId ?? '', letterDate ?? ''),
    queryFn: () => fetchStoredDailyLetter(userId!, letterDate!),
    enabled: Boolean(userId && letterDate),
    staleTime: Infinity,
  });

  return {
    letter: (query.data ?? null) as StoredDailyLetter | null,
    loading: Boolean(userId && letterDate) && query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
