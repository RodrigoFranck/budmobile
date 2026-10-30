import { useCallback, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery, useSetAppProfileCache } from '@/hooks/useAppProfileQuery';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { updateAppProfile, type AppProfile } from '@/services/profileQuery';
import { isVoiceId, storedVoiceId, type VoiceId } from '@/theme';
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
  voice?: VoiceId;
  origin?: string;
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
    voice: isVoiceId(data.voice) ? data.voice : undefined,
    origin: asString(data.origin),
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
    voice: isVoiceId(answers.voice) ? answers.voice : undefined,
    origin: asString(answers.origin),
  };
}

export function mergeOnboardingPreferences(
  existing: V3Preferences,
  answers: Record<string, string>,
  shareConversations: boolean,
): V3Preferences {
  const fromAnswers = preferencesFromOnboardingAnswers(answers, shareConversations);
  return {
    ...existing,
    therapy: fromAnswers.therapy ?? existing.therapy,
    mood: fromAnswers.mood ?? existing.mood,
    weight: fromAnswers.weight ?? existing.weight,
    relationships: fromAnswers.relationships ?? existing.relationships,
    focus: fromAnswers.focus ?? existing.focus,
    sixWeeks: fromAnswers.sixWeeks ?? existing.sixWeeks,
    helpStyle: fromAnswers.helpStyle ?? existing.helpStyle,
    strengths: fromAnswers.strengths ?? existing.strengths,
    blockers: fromAnswers.blockers ?? existing.blockers,
    faith: fromAnswers.faith ?? existing.faith,
    neurodivergence: fromAnswers.neurodivergence ?? existing.neurodivergence,
    interests: fromAnswers.interests ?? existing.interests,
    notifications: existing.notifications ?? DEFAULT_NOTIFICATIONS,
    appLock: existing.appLock ?? false,
    shareResearch: existing.shareResearch ?? false,
    shareConversations,
    voice: fromAnswers.voice ?? existing.voice,
    origin: fromAnswers.origin ?? existing.origin,
  };
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
      voice: storedVoiceId(profile?.selected_voice, prefs),
      notifications: prefs.notifications ?? DEFAULT_NOTIFICATIONS,
      appLock: Boolean(prefs.appLock),
      shareConversations: prefs.shareConversations !== false,
      shareResearch: Boolean(prefs.shareResearch),
      origin: prefs.origin ?? '',
    };
  }, [prefs, profile]);

  const profileIncomplete = useMemo(
    () => MOTIVE_ROWS.every((row) => formatPrefValue(values[row.field], values.gender) === 'Não respondido'),
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
        ...(selectedVoice ? { voice: selectedVoice } : {}),
      };
      const profilePatch: Partial<AppProfile> & { v3_preferences: Json } = {
        v3_preferences: nextPrefs as Json,
      };
      if (name !== undefined) profilePatch.name = name;
      if (age !== undefined) profilePatch.age = age;
      if (gender !== undefined) profilePatch.gender = gender;
      if (prefPatch.interests !== undefined) profilePatch.hobbies = prefPatch.interests;
      if (prefPatch.focus !== undefined) {
        profilePatch.conversation_goal = splitPrefList(prefPatch.focus).join(' · ') || null;
      }
      if (prefPatch.relationships !== undefined) {
        profilePatch.relationship = splitPrefList(prefPatch.relationships).join(' · ') || null;
      }
      if (selectedVoice) profilePatch.selected_voice = selectedVoice;

      await updateAppProfile(user.id, profilePatch);

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
