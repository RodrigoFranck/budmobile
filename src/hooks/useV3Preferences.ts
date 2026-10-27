import { useCallback, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery, useSetAppProfileCache } from '@/hooks/useAppProfileQuery';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { AppProfile } from '@/services/profileQuery';
import { voiceOptions, type VoiceId } from '@/theme';
import {
  formatPrefValue,
  MOTIVE_ROWS,
  splitPrefList,
  type PrefEditField,
} from '@/pages/menu/menuCatalog';

export type NotificationPrefs = {
  letter: boolean;
  weekly: boolean;
  screening: boolean;
  reminders: boolean;
};

export type V3Preferences = {
  therapy?: string;
  mood?: string;
  weight?: string[];
  relationships?: string[];
  focus?: string[];
  sixWeeks?: string[];
  helpStyle?: string[];
  strengths?: string[];
  blockers?: string[];
  faith?: string;
  neurodivergence?: string;
  interests?: string[];
  notifications?: NotificationPrefs;
  appLock?: boolean;
  shareConversations?: boolean;
  shareResearch?: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  letter: true,
  weekly: true,
  screening: true,
  reminders: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string' && Boolean(item));
    return items.length ? items : undefined;
  }
  if (typeof value === 'string' && value.trim()) {
    return splitPrefList(value);
  }
  return undefined;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function parseV3Preferences(raw: unknown): V3Preferences {
  const data = asRecord(raw);
  const notifications = asRecord(data.notifications);
  return {
    therapy: asString(data.therapy),
    mood: asString(data.mood),
    weight: asStringList(data.weight),
    relationships: asStringList(data.relationships),
    focus: asStringList(data.focus),
    sixWeeks: asStringList(data.sixWeeks),
    helpStyle: asStringList(data.helpStyle),
    strengths: asStringList(data.strengths),
    blockers: asStringList(data.blockers),
    faith: asString(data.faith),
    neurodivergence: asString(data.neurodivergence),
    interests: asStringList(data.interests),
    notifications: {
      letter: asBoolean(notifications.letter, DEFAULT_NOTIFICATIONS.letter),
      weekly: asBoolean(notifications.weekly, DEFAULT_NOTIFICATIONS.weekly),
      screening: asBoolean(notifications.screening, DEFAULT_NOTIFICATIONS.screening),
      reminders: asBoolean(notifications.reminders, DEFAULT_NOTIFICATIONS.reminders),
    },
    appLock: asBoolean(data.appLock, false),
    shareConversations: asBoolean(data.shareConversations, true),
    shareResearch: asBoolean(data.shareResearch, false),
  };
}

export function preferencesFromOnboardingAnswers(
  answers: Record<string, string>,
  shareConversations: boolean,
): V3Preferences {
  return {
    therapy: asString(answers.therapy),
    mood: asString(answers.mood),
    weight: asStringList(answers.weight),
    relationships: asStringList(answers.relationships),
    focus: asStringList(answers.focus),
    sixWeeks: asStringList(answers.sixWeeks),
    helpStyle: asStringList(answers.helpStyle),
    strengths: asStringList(answers.strengths),
    blockers: asStringList(answers.blockers),
    faith: asString(answers.faith),
    neurodivergence: asString(answers.neurodivergence),
    interests: asStringList(answers.interests),
    notifications: { ...DEFAULT_NOTIFICATIONS },
    appLock: false,
    shareConversations,
    shareResearch: false,
  };
}

function voiceFromValue(value: unknown): VoiceId {
  if (typeof value === 'string' && voiceOptions.some((option) => option.id === value)) {
    return value as VoiceId;
  }
  return 'amanda';
}

export function useV3Preferences() {
  const { user } = useAuth();
  const { data: profile } = useAppProfileQuery();
  const setProfileCache = useSetAppProfileCache();
  const prefs = useMemo(() => parseV3Preferences(profile?.v3_preferences), [profile?.v3_preferences]);

  const values = useMemo(() => {
    const interests = prefs.interests ?? profile?.hobbies ?? [];
    return {
      displayName: profile?.name ?? '',
      ageRange: profile?.age ?? '',
      gender: profile?.gender ?? '',
      therapy: prefs.therapy ?? '',
      mood: prefs.mood ?? '',
      weight: prefs.weight ?? [],
      relationships: prefs.relationships ?? [],
      focus: prefs.focus ?? [],
      sixWeeks: prefs.sixWeeks ?? [],
      helpStyle: prefs.helpStyle ?? [],
      strengths: prefs.strengths ?? [],
      blockers: prefs.blockers ?? [],
      faith: prefs.faith ?? '',
      neurodivergence: prefs.neurodivergence ?? '',
      interests,
      voice: voiceFromValue(profile?.selected_voice),
      notifications: prefs.notifications ?? DEFAULT_NOTIFICATIONS,
      appLock: Boolean(prefs.appLock),
      shareConversations: prefs.shareConversations !== false,
      shareResearch: Boolean(prefs.shareResearch),
    };
  }, [prefs, profile]);

  const profileIncomplete = useMemo(
    () => MOTIVE_ROWS.every((row) => formatPrefValue(values[row.field]) === 'Não respondido'),
    [values],
  );

  const persist = useCallback(
    async (patch: Partial<V3Preferences> & { name?: string; age?: string; gender?: string; selectedVoice?: VoiceId }) => {
      if (!user?.id) return;
      const { name, age, gender, selectedVoice, ...prefPatch } = patch;
      const nextPrefs: V3Preferences = {
        ...prefs,
        ...prefPatch,
        notifications: prefPatch.notifications
          ? { ...(prefs.notifications ?? DEFAULT_NOTIFICATIONS), ...prefPatch.notifications }
          : prefs.notifications,
      };
      const profilePatch: Partial<AppProfile> & { v3_preferences: Json } = {
        v3_preferences: nextPrefs as Json,
      };
      if (name !== undefined) profilePatch.name = name;
      if (age !== undefined) profilePatch.age = age;
      if (gender !== undefined) profilePatch.gender = gender;
      if (prefPatch.interests !== undefined) profilePatch.hobbies = prefPatch.interests;
      if (selectedVoice) profilePatch.selected_voice = selectedVoice;

      const { error } = await supabase
        .from('profiles')
        .update(profilePatch as never)
        .eq('user_id', user.id);
      if (error) throw error;

      if (selectedVoice || prefPatch.shareConversations !== undefined) {
        await supabase.auth.updateUser({
          data: {
            ...(selectedVoice ? { selected_voice: selectedVoice } : {}),
            ...(prefPatch.shareConversations !== undefined
              ? { share_conversations: prefPatch.shareConversations }
              : {}),
          },
        });
      }

      setProfileCache((current) =>
        current
          ? {
              ...current,
              ...profilePatch,
            }
          : null,
      );
    },
    [prefs, setProfileCache, user?.id],
  );

  const saveField = useCallback(
    async (field: PrefEditField, value: string | string[]) => {
      if (field === 'displayName') {
        await persist({ name: Array.isArray(value) ? value[0] ?? '' : value });
        return;
      }
      if (field === 'ageRange') {
        await persist({ age: Array.isArray(value) ? value[0] ?? '' : value });
        return;
      }
      if (field === 'gender') {
        await persist({ gender: Array.isArray(value) ? value[0] ?? '' : value });
        return;
      }
      if (field === 'interests') {
        const interests = Array.isArray(value) ? value : splitPrefList(value);
        await persist({ interests });
        return;
      }
      const next = Array.isArray(value) ? value : value;
      await persist({ [field]: next } as Partial<V3Preferences>);
    },
    [persist],
  );

  const fieldValue = useCallback(
    (field: PrefEditField): string | string[] => values[field],
    [values],
  );

  return {
    values,
    prefs,
    profileIncomplete,
    persist,
    saveField,
    fieldValue,
    format: formatPrefValue,
  };
}
