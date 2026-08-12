import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  formatDateBrasilia,
  getMsUntilNextMidnightBrasilia,
  getNowInBrasilia,
  getTodayInBrasilia,
} from '@/utils/dateUtils';

export type CheckinType = 'morning' | 'post_training' | 'post_game';
export type FeedbackType = 'negative' | 'positive' | 'love';

export interface CheckinReport {
  headline: string;
  analysis: string;
  reflection_questions: string[];
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  checkin_type: CheckinType;
  responses: Record<string, unknown>;
  ai_report: CheckinReport | null;
  feedback_type: FeedbackType | null;
  created_at: string;
  updated_at: string;
}

export function useCheckIns() {
  const { user } = useAuth();
  const [todayCheckins, setTodayCheckins] = useState<DailyCheckin[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckins = useCallback(async () => {
    if (!user) {
      setTodayCheckins([]);
      setRecentCheckins([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = getTodayInBrasilia();
    trackedBrasiliaDateRef.current = today;
    const sevenDaysAgo = getNowInBrasilia();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatDateBrasilia(sevenDaysAgo);

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('checkin_date', sevenDaysAgoStr)
      .order('checkin_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar check-ins:', error);
      setLoading(false);
      return;
    }

    const all = (data ?? []) as unknown as DailyCheckin[];
    setRecentCheckins(all);
    setTodayCheckins(all.filter((c) => c.checkin_date === today));
    setLoading(false);
  }, [user]);

  const trackedBrasiliaDateRef = useRef(getTodayInBrasilia());

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnightRefresh = () => {
      timeoutId = setTimeout(() => {
        trackedBrasiliaDateRef.current = getTodayInBrasilia();
        void fetchCheckins();
        scheduleMidnightRefresh();
      }, getMsUntilNextMidnightBrasilia());
    };

    scheduleMidnightRefresh();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, fetchCheckins]);

  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;

      const today = getTodayInBrasilia();
      if (today === trackedBrasiliaDateRef.current) return;

      trackedBrasiliaDateRef.current = today;
      void fetchCheckins();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, fetchCheckins]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const today = getTodayInBrasilia();
      if (today === trackedBrasiliaDateRef.current) return;

      trackedBrasiliaDateRef.current = today;
      void fetchCheckins();
    }, [user, fetchCheckins]),
  );

  const submitCheckin = useCallback(
    async (
      checkinType: CheckinType,
      checkinResponses: Record<string, unknown>,
    ): Promise<DailyCheckin | null> => {
      if (!user) return null;
      const today = getTodayInBrasilia();

      const { data, error } = await supabase
        .from('daily_checkins')
        .upsert(
          {
            user_id: user.id,
            checkin_date: today,
            checkin_type: checkinType,
            responses: checkinResponses as never,
          },
          { onConflict: 'user_id,checkin_date,checkin_type' },
        )
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar check-in:', error);
        return null;
      }

      const checkin = data as unknown as DailyCheckin;
      await fetchCheckins();
      return checkin;
    },
    [user, fetchCheckins],
  );

  const updateReport = useCallback(
    async (checkinId: string, report: CheckinReport): Promise<void> => {
      const { error } = await supabase
        .from('daily_checkins')
        .update({ ai_report: report as never })
        .eq('id', checkinId);
      if (error) console.error('Erro ao atualizar relatório:', error);
      await fetchCheckins();
    },
    [fetchCheckins],
  );

  const todayMorning = todayCheckins.find((c) => c.checkin_type === 'morning') ?? null;
  const todayPostTraining = todayCheckins.find((c) => c.checkin_type === 'post_training') ?? null;
  const todayPostGame = todayCheckins.find((c) => c.checkin_type === 'post_game') ?? null;

  return {
    todayMorning,
    todayPostTraining,
    todayPostGame,
    recentCheckins,
    loading,
    submitCheckin,
    updateReport,
    refetch: fetchCheckins,
  };
}
