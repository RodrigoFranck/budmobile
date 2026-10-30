import { useMemo } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlowProvider, flowStateFromSavedProfile } from '@/contexts/OnboardingFlowContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import OnboardingV3Screen from '@/pages/onboardingV3/OnboardingV3Screen';
import { useV3Colors } from '@/theme';

export default function OnboardingReplayScreen() {
  const colors = useV3Colors();
  const { user } = useAuth();
  const { values } = useV3Preferences();
  const { data: profile, isPending } = useAppProfileQuery();
  const metadataOrigin =
    typeof user?.user_metadata?.origin === 'string' ? user.user_metadata.origin : '';

  const initial = useMemo(
    () =>
      flowStateFromSavedProfile({
        displayName: values.displayName,
        ageRange: values.ageRange,
        gender: values.gender,
        therapy: values.therapy,
        mood: values.mood,
        weight: values.weight,
        relationships: values.relationships,
        focus: values.focus,
        sixWeeks: values.sixWeeks,
        helpStyle: values.helpStyle,
        strengths: values.strengths,
        blockers: values.blockers,
        faith: values.faith,
        neurodivergence: values.neurodivergence,
        interests: values.interests,
        voice: values.voice,
        origin: values.origin || metadataOrigin,
        shareConversations: values.shareConversations,
        initialThoughts: profile?.initial_thoughts,
        conversationGoal: profile?.conversation_goal,
      }),
    [metadataOrigin, profile?.conversation_goal, profile?.initial_thoughts, values],
  );

  if (isPending && !profile) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <OnboardingFlowProvider initial={initial}>
      <OnboardingV3Screen replay />
    </OnboardingFlowProvider>
  );
}
