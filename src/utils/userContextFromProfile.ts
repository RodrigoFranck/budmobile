import { parseV3Preferences } from '@/hooks/useV3Preferences';
import type { UserContext } from '@/utils/chatStream';
import { joinPrefList } from '@/utils/formatDeclaredUserContext';

export type ProfileForUserContext = {
  name?: string | null;
  age?: string | null;
  gender?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  hobbies?: string[] | null;
  conversation_goal?: string | null;
  initial_thoughts?: string | null;
  v3_preferences?: unknown;
};

export function userContextFieldsFromProfile(
  profile: ProfileForUserContext | null | undefined,
): Omit<UserContext, 'isFirstInteractionOfDay'> {
  const prefs = parseV3Preferences(profile?.v3_preferences);
  const hobbies =
    profile?.hobbies && profile.hobbies.length > 0
      ? profile.hobbies
      : prefs.interests ?? null;

  return {
    name: profile?.name || null,
    age: profile?.age || null,
    gender: profile?.gender || null,
    occupation: profile?.occupation || null,
    relationship: profile?.relationship || joinPrefList(prefs.relationships) || null,
    hobbies,
    conversationGoal: profile?.conversation_goal || joinPrefList(prefs.focus) || null,
    initialThoughts: profile?.initial_thoughts || prefs.mood || null,
  };
}
