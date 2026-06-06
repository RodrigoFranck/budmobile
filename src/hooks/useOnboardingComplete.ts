import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { supabase } from '@/integrations/supabase/client';

export function useOnboardingComplete() {
  const { user, refreshOnboardingStatus } = useAuth();
  const {
    displayName,
    ageRange,
    initialThoughts,
    conversationGoal,
    shareConversations,
  } = useOnboardingFlow();
  const [submitting, setSubmitting] = useState(false);

  const completeOnboarding = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Sessão inválida. Faça login novamente.');
      return { error: new Error('no user') };
    }

    setSubmitting(true);
    try {
      const ageLabel = ageRange ?? null;

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          name: displayName.trim() || user.email?.split('@')[0] || 'Bud',
          age: ageLabel,
          initial_thoughts: initialThoughts.trim() || null,
          conversation_goal: conversationGoal.trim() || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (profileError) {
        Alert.alert('Erro', profileError.message);
        return { error: profileError };
      }

      await supabase.auth.updateUser({
        data: {
          share_conversations: shareConversations,
          display_name: displayName.trim(),
        },
      });

      await refreshOnboardingStatus();
      return { error: null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Erro desconhecido');
      Alert.alert('Erro', err.message);
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
    refreshOnboardingStatus,
  ]);

  return { completeOnboarding, submitting };
}
