import { useMemo } from 'react';

import { applyGenderedCopy, genderVoiceFrom } from '@/copy/genderedCopy';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';

export function useGenderedCopy(overrideGender?: string | null) {
  const { data: profile } = useAppProfileQuery();
  const gender = overrideGender || profile?.gender || '';

  return useMemo(() => {
    const voice = genderVoiceFrom(gender);
    return {
      gender,
      voice,
      g: (text: string) => applyGenderedCopy(text, voice),
    };
  }, [gender]);
}
