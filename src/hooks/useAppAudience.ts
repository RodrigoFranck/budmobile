import { useMemo } from 'react';

import { canAccess, resolveAudience, type Capability } from '@/access';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';

export function useAppAudience() {
  const { data } = useAppProfileQuery();

  return useMemo(() => {
    const audience = resolveAudience(data);
    return {
      audience,
      organizationId: audience === 'institution' ? data?.organization_id ?? null : null,
      isInstitution: audience === 'institution',
      can: (capability: Capability) => canAccess(audience, capability),
    };
  }, [data]);
}
