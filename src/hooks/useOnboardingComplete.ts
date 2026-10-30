import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ACTION_EVENTS, logActionEvent } from '@/analytics';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppProfileQuery, useSetAppProfileCache } from '@/hooks/useAppProfileQuery';
import { mergeOnboardingPreferences, parseV3Preferences } from '@/hooks/useV3Preferences';
import { updateAppProfile } from '@/services/profileQuery';
import type { Json } from '@/integrations/supabase/types';

export function useOnboardingComplete() {
  const { user, refreshOnboardingStatus } = useAuth();
  const {
    displayName,
    ageRange,
    initialThoughts,
    conversationGoal,
    shareConversations,
    answers,
  } = useOnboardingFlow();
  const { data: profile } = useAppProfileQuery();
  const setProfileCache = useSetAppProfileCache();
  const { showAlert } = useAppAlert();
  const [submitting, setSubmitting] = useState(false);

  const completeOnboarding = useCallback(async (options?: { replay?: boolean }) => {
    if (!user?.id) {
      showAlert({ title: 'Erro', message: 'Sessão inválida. Faça login novamente.' });
      return { error: new Error('no user') };
    }

    setSubmitting(true);
    try {
      const nextName = displayName.trim() || profile?.name || user.email?.split('@')[0] || 'Bud';
      const nextAge = ageRange ?? profile?.age ?? null;
      const nextGender = answers.gender ?? profile?.gender ?? null;
      const nextThoughts =
        answers.anythingElse?.trim() ||
        initialThoughts.trim() ||
        answers.mood ||
        profile?.initial_thoughts ||
        null;
      const nextGoal =
        conversationGoal.trim() || answers.focus || profile?.conversation_goal || null;
      const nextHobbies = answers.interests
        ? answers.interests.split(' · ').filter(Boolean)
        : profile?.hobbies ?? null;
      const nextRelationship = answers.relationships || profile?.relationship || null;
      const nextPrefs = mergeOnboardingPreferences(
        parseV3Preferences(profile?.v3_preferences),
        answers,
        shareConversations,
      );
      const nextVoice = answers.voice ?? profile?.selected_voice ?? nextPrefs.voice ?? null;

      try {
        await updateAppProfile(
          user.id,
          {
            user_id: user.id,
            name: nextName,
            age: nextAge,
            gender: nextGender,
            initial_thoughts: nextThoughts,
            conversation_goal: nextGoal,
            relationship: nextRelationship,
            selected_voice: nextVoice,
            hobbies: nextHobbies,
            v3_preferences: nextPrefs as Json,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          'upsert',
        );
      } catch (profileError) {
        const message = profileError instanceof Error ? profileError.message : 'Erro ao salvar perfil';
        showAlert({ title: 'Erro', message });
        return { error: profileError instanceof Error ? profileError : new Error(message) };
      }

      await supabase.auth.updateUser({
        data: {
          share_conversations: shareConversations,
          display_name: nextName,
          selected_voice: nextVoice,
          origin: answers.origin ?? null,
        },
      });

      setProfileCache((current) =>
        current
          ? {
              ...current,
              name: nextName,
              age: nextAge,
              gender: nextGender,
              initial_thoughts: nextThoughts,
              conversation_goal: nextGoal,
              relationship: nextRelationship,
              selected_voice: nextVoice,
              hobbies: nextHobbies,
              v3_preferences: nextPrefs as Json,
              onboarding_completed: true,
            }
          : null,
      );

      await refreshOnboardingStatus();
      if (!options?.replay) {
        void logActionEvent(ACTION_EVENTS.ONBOARDING_COMPLETED);
      }
      return { error: null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Erro desconhecido');
      showAlert({ title: 'Erro', message: err.message });
      return { error: err };
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.id,
    user?.email,
    displayName,
    ageRange,
    initialThoughts,
    conversationGoal,
    shareConversations,
    answers,
    profile,
    setProfileCache,
    refreshOnboardingStatus,
    showAlert,
  ]);

  return { completeOnboarding, submitting };
}
