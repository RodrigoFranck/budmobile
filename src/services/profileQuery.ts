import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AppProfile = {
  name: string | null;
  initial_thoughts: string | null;
  conversation_goal: string | null;
  occupation: string | null;
  age: string | null;
  gender: string | null;
  relationship: string | null;
  hobbies: string[] | null;
  onboarding_completed: boolean | null;
  dark_mode: boolean | null;
  push_notifications_enabled: boolean | null;
  notification_daily_time: string | null;
  timezone: string | null;
  app_mode: string | null;
  organization_id: string | null;
  selected_voice: string | null;
  v3_preferences: Json | null;
};

const PROFILE_SELECT =
  'name, initial_thoughts, conversation_goal, occupation, age, gender, relationship, hobbies, onboarding_completed, dark_mode, push_notifications_enabled, notification_daily_time, timezone, selected_voice, v3_preferences';

export async function fetchAppProfile(userId: string): Promise<AppProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        ...data,
        app_mode: 'b2c',
        organization_id: null,
        selected_voice: data.selected_voice ?? null,
        v3_preferences: data.v3_preferences ?? null,
      }
    : null;
}
