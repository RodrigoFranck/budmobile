import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { fetchAppProfile, type AppProfile } from '@/services/profileQuery';

export function useAppProfileQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => fetchAppProfile(userId!),
    enabled: !!userId,
  });
}

export function useInvalidateAppProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    if (!user?.id) return;
    return queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
  };
}

export function useSetAppProfileCache() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return (updater: (current: AppProfile | null | undefined) => AppProfile | null) => {
    if (!user?.id) return;
    queryClient.setQueryData<AppProfile | null>(queryKeys.profile(user.id), updater);
  };
}
