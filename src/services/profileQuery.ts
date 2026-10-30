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

const PROFILE_SELECT_BASE =
  'name, initial_thoughts, conversation_goal, occupation, age, gender, relationship, hobbies, onboarding_completed, dark_mode, push_notifications_enabled, notification_daily_time, timezone';

const OPTIONAL_PROFILE_COLUMNS = ['selected_voice', 'v3_preferences', 'app_mode', 'organization_id'] as const;

const PROFILE_SELECT_V3 = `${PROFILE_SELECT_BASE}, v3_preferences, app_mode, organization_id`;

let optionalProfileColumnsAvailable = true;

function omitOptionalProfileColumns(patch: Record<string, unknown>): Record<string, unknown> {
  const next = { ...patch };
  for (const column of OPTIONAL_PROFILE_COLUMNS) {
    delete next[column];
  }
  return next;
}

function markOptionalProfileColumnsMissing() {
  optionalProfileColumnsAvailable = false;
}

type ProfileRow = {
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
  selected_voice?: string | null;
  v3_preferences?: Json | null;
  app_mode?: string | null;
  organization_id?: string | null;
};

export function isProfileSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    /schema cache/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
}

function toAppProfile(data: ProfileRow): AppProfile {
  return {
    name: data.name,
    initial_thoughts: data.initial_thoughts,
    conversation_goal: data.conversation_goal,
    occupation: data.occupation,
    age: data.age,
    gender: data.gender,
    relationship: data.relationship,
    hobbies: data.hobbies,
    onboarding_completed: data.onboarding_completed,
    dark_mode: data.dark_mode,
    push_notifications_enabled: data.push_notifications_enabled,
    notification_daily_time: data.notification_daily_time,
    timezone: data.timezone,
    app_mode: data.app_mode ?? 'b2c',
    organization_id: data.organization_id ?? null,
    selected_voice: data.selected_voice ?? null,
    v3_preferences: data.v3_preferences ?? null,
  };
}

export async function fetchAppProfile(userId: string): Promise<AppProfile | null> {
  if (optionalProfileColumnsAvailable) {
    const primary = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_V3)
      .eq('user_id', userId)
      .maybeSingle();

    if (!primary.error) {
      return primary.data ? toAppProfile(primary.data as ProfileRow) : null;
    }

    if (!isProfileSchemaError(primary.error)) {
      throw primary.error;
    }

    markOptionalProfileColumnsMissing();
  }

  const fallback = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_BASE)
    .eq('user_id', userId)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }

  return fallback.data ? toAppProfile(fallback.data as ProfileRow) : null;
}

export async function updateAppProfile(
  userId: string,
  patch: Record<string, unknown>,
  mode: 'update' | 'upsert' = 'update',
): Promise<void> {
  const run = (body: Record<string, unknown>) =>
    mode === 'upsert'
      ? supabase.from('profiles').upsert(body as never, { onConflict: 'user_id' })
      : supabase.from('profiles').update(body as never).eq('user_id', userId);

  const body = optionalProfileColumnsAvailable ? patch : omitOptionalProfileColumns(patch);
  if (Object.keys(body).length === 0) {
    return;
  }

  const first = await run(body);
  if (!first.error) return;
  if (!isProfileSchemaError(first.error) || !optionalProfileColumnsAvailable) {
    throw first.error;
  }

  markOptionalProfileColumnsMissing();
  const fallbackPatch = omitOptionalProfileColumns(patch);
  if (Object.keys(fallbackPatch).length === 0) {
    return;
  }

  const retry = await run(fallbackPatch);
  if (retry.error) throw retry.error;
}
