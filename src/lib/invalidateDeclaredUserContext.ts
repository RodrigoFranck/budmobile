import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';

export function invalidateDeclaredUserContext(userId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.declaredUserContext(userId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.historyDays(userId) });
}
