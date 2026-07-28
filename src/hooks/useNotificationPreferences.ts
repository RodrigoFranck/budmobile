import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { AppProfile } from '@/services/profileQuery';
import {
  registerForPushNotificationsAsync,
  removeAllPushTokensForUser,
  requestNotificationPermissionAsync,
  savePushTokenForUser,
} from '@/services/pushNotifications';

const DEFAULT_TIME = '20:00:00';
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

function formatTimeForDisplay(time: string): string {
  return time.slice(0, 5);
}

function getDeviceTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      return tz;
    }
  } catch {
    // fallback below
  }
  return DEFAULT_TIMEZONE;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isFetched } = useAppProfileQuery();
  const [enabled, setEnabled] = useState(true);
  const [dailyTime, setDailyTime] = useState(DEFAULT_TIME);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setEnabled(true);
      setDailyTime(DEFAULT_TIME);
      setTimezone(DEFAULT_TIMEZONE);
      setLoaded(true);
      return;
    }

    if (!isFetched) {
      setLoaded(false);
      return;
    }

    if (profile) {
      setEnabled(profile.push_notifications_enabled !== false);
      setDailyTime(profile.notification_daily_time ?? DEFAULT_TIME);
      setTimezone(profile.timezone ?? getDeviceTimezone());
    } else {
      setTimezone(getDeviceTimezone());
    }

    setLoaded(true);
  }, [user?.id, isFetched, profile]);

  const setNotificationsEnabled = useCallback(
    async (nextEnabled: boolean) => {
      if (!user?.id) {
        return;
      }

      setSaving(true);
      setEnabled(nextEnabled);

      try {
        if (Platform.OS !== 'web' && nextEnabled) {
          const granted = await requestNotificationPermissionAsync();
          if (!granted) {
            throw new Error(
              'Permissão de notificações negada. Ative em Ajustes > Bud > Notificações.',
            );
          }
        }

        const nextTimezone = getDeviceTimezone();
        const { error } = await supabase
          .from('profiles')
          .update({
            push_notifications_enabled: nextEnabled,
            timezone: nextTimezone,
          })
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        queryClient.setQueryData<AppProfile | null>(
          queryKeys.profile(user.id),
          (current) =>
            current
              ? {
                  ...current,
                  push_notifications_enabled: nextEnabled,
                  timezone: nextTimezone,
                }
              : current,
        );

        if (Platform.OS === 'web') {
          return;
        }

        if (nextEnabled) {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushTokenForUser(user.id, token);
          }
          return;
        }

        await removeAllPushTokensForUser(user.id);
      } catch (error) {
        setEnabled(!nextEnabled);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [queryClient, user?.id],
  );

  const setDailyNotificationTime = useCallback(
    async (hour: number) => {
      if (!user?.id) {
        return;
      }

      const nextTime = `${String(hour).padStart(2, '0')}:00:00`;
      const nextTimezone = getDeviceTimezone();
      setSaving(true);
      setDailyTime(nextTime);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            notification_daily_time: nextTime,
            timezone: nextTimezone,
          })
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        queryClient.setQueryData<AppProfile | null>(
          queryKeys.profile(user.id),
          (current) =>
            current
              ? {
                  ...current,
                  notification_daily_time: nextTime,
                  timezone: nextTimezone,
                }
              : current,
        );
      } catch (error) {
        const previousHour = Number.parseInt(dailyTime.slice(0, 2), 10);
        setDailyTime(`${String(previousHour).padStart(2, '0')}:00:00`);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [dailyTime, queryClient, user?.id],
  );

  return {
    enabled,
    dailyTime,
    dailyTimeLabel: formatTimeForDisplay(dailyTime),
    timezone,
    loaded,
    saving,
    setNotificationsEnabled,
    setDailyNotificationTime,
  };
}
