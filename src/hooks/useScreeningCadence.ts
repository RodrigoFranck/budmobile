import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { supabase } from '@/integrations/supabase/client';
import { HEALTH_SURVEY_INSTRUMENT } from '@/pages/institution/healthSurvey';
import type { MainTabNavigationProp } from '@/types/navigation';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

let promptedThisSession = false;

export function useScreeningCadence(options?: { autoNavigate?: boolean }) {
  const { user } = useAuth();
  const { can } = useAppAudience();
  const navigation = useNavigation<MainTabNavigationProp>();
  const [due, setDue] = useState(false);
  const checking = useRef(false);
  const autoNavigate = options?.autoNavigate ?? false;
  const enabled = can('health_survey');

  const refresh = useCallback(async () => {
    if (!enabled) {
      setDue(false);
      return;
    }
    if (!user?.id || checking.current) return;
    checking.current = true;
    try {
      const { data } = await supabase
        .from('clinical_screenings' as never)
        .select('instrument, completed_at')
        .eq('user_id', user.id)
        .eq('instrument', HEALTH_SURVEY_INSTRUMENT)
        .order('completed_at', { ascending: false })
        .limit(1);

      const rows = (data as { instrument: string; completed_at: string }[] | null) ?? [];
      const latest = rows[0]?.completed_at ? new Date(rows[0].completed_at).getTime() : 0;
      const isDue = !latest || Date.now() - latest > NINETY_DAYS_MS;
      setDue(isDue);

      if (autoNavigate && isDue && !promptedThisSession) {
        promptedThisSession = true;
        navigation.navigate('Institution', { forced: true });
      }
    } finally {
      checking.current = false;
    }
  }, [autoNavigate, enabled, navigation, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const snooze = useCallback(() => {
    promptedThisSession = true;
  }, []);

  return { due, snooze, refresh };
}
