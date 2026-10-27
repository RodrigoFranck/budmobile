import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { supabase } from '@/integrations/supabase/client';
import type { MainTabNavigationProp } from '@/types/navigation';

const CORE_INSTRUMENTS = ['gad7', 'phq9', 'prescribed_checkin'] as const;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

let promptedThisSession = false;

export function useScreeningCadence(options?: { autoNavigate?: boolean }) {
  const { user } = useAuth();
  const { profile } = useTabScreenContext();
  const navigation = useNavigation<MainTabNavigationProp>();
  const [due, setDue] = useState(false);
  const checking = useRef(false);
  const autoNavigate = options?.autoNavigate ?? false;

  const isInstitution = profile?.app_mode === 'institution' || Boolean(profile?.organization_id);

  const refresh = useCallback(async () => {
    if (!user?.id || !isInstitution || checking.current) return;
    checking.current = true;
    try {
      const { data } = await supabase
        .from('clinical_screenings' as never)
        .select('instrument, completed_at')
        .eq('user_id', user.id)
        .in('instrument', [...CORE_INSTRUMENTS])
        .order('completed_at', { ascending: false })
        .limit(12);

      const rows = (data as { instrument: string; completed_at: string }[] | null) ?? [];
      const latestCore = rows[0]?.completed_at ? new Date(rows[0].completed_at).getTime() : 0;
      const isDue = !latestCore || Date.now() - latestCore > NINETY_DAYS_MS;
      setDue(isDue);

      if (autoNavigate && isDue && !promptedThisSession) {
        promptedThisSession = true;
        navigation.navigate('Institution', { forced: true });
      }
    } finally {
      checking.current = false;
    }
  }, [autoNavigate, isInstitution, navigation, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const snooze = useCallback(() => {
    promptedThisSession = true;
    setDue(true);
  }, []);

  return { due: isInstitution && due, snooze, refresh };
}
