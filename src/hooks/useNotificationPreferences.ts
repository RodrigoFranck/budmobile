import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  registerForPushNotificationsAsync,
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

    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('push_notifications_enabled, notification_daily_time, timezone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (data) {
        setEnabled(data.push_notifications_enabled !== false);
        setDailyTime(data.notification_daily_time ?? DEFAULT_TIME);
        setTimezone(data.timezone ?? getDeviceTimezone());
      } else {
        setTimezone(getDeviceTimezone());
      }

      setLoaded(true);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setNotificationsEnabled = useCallback(
    async (nextEnabled: boolean) => {
      if (!user?.id) {
        return;
      }

      setSaving(true);
      setEnabled(nextEnabled);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            push_notifications_enabled: nextEnabled,
            timezone: getDeviceTimezone(),
          })
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (nextEnabled && Platform.OS !== 'web') {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushTokenForUser(user.id, token);
          }
        }
      } catch (error) {
        setEnabled(!nextEnabled);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user?.id],
  );

  const setDailyNotificationTime = useCallback(
    async (hour: number) => {
      if (!user?.id) {
        return;
      }

      const nextTime = `${String(hour).padStart(2, '0')}:00:00`;
      setSaving(true);
      setDailyTime(nextTime);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            notification_daily_time: nextTime,
            timezone: getDeviceTimezone(),
          })
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      } catch (error) {
        const previousHour = Number.parseInt(dailyTime.slice(0, 2), 10);
        setDailyTime(`${String(previousHour).padStart(2, '0')}:00:00`);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [dailyTime, user?.id],
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
