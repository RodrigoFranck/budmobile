import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { loadWeeklySummary } from '@/services/weeklySummaryQuery';

export function useWeeklySummary(weekStartKey: string) {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.weeklySummary(userId, weekStartKey),
    queryFn: () => loadWeeklySummary(userId, weekStartKey),
    enabled: Boolean(userId && weekStartKey),
  });
}
