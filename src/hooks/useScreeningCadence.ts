import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { supabase } from '@/integrations/supabase/client';
import { HEALTH_SURVEY_INSTRUMENT } from '@/pages/institution/healthSurvey';
import type { MainTabNavigationProp } from '@/types/navigation';

const SURVEY_CADENCE_DAYS = 30;
const SURVEY_CADENCE_MS = SURVEY_CADENCE_DAYS * 24 * 60 * 60 * 1000;

let promptedThisSession = false;
let sharedDue = false;
const dueListeners = new Set<(due: boolean) => void>();

function publishDue(next: boolean) {
  sharedDue = next;
  dueListeners.forEach((listener) => listener(next));
}

export function useScreeningCadence(options?: { autoNavigate?: boolean }) {
  const { user } = useAuth();
  const { can } = useAppAudience();
  const navigation = useNavigation<MainTabNavigationProp>();
  const [due, setDue] = useState(sharedDue);
  const checking = useRef(false);
  const autoNavigate = options?.autoNavigate ?? false;
  const enabled = can('health_survey');

  useEffect(() => {
    const listener = (next: boolean) => setDue(next);
    dueListeners.add(listener);
    setDue(sharedDue);
    return () => {
      dueListeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      publishDue(false);
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
      const isDue = !latest || Date.now() - latest >= SURVEY_CADENCE_MS;
      publishDue(isDue);

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

  const markComplete = useCallback(() => {
    promptedThisSession = true;
    publishDue(false);
  }, []);

  return { due, snooze, refresh, markComplete };
}
