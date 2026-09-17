import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useNavigationState } from '@react-navigation/native';

import { ACTION_EVENTS, logActionEvent } from '@/analytics';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingAbandonmentTracker() {
  const { onboardingCompleted } = useAuth();
  const currentStep = useNavigationState(
    (state) => state.routes[state.index]?.name ?? 'OnboardingName',
  );
  const currentStepRef = useRef(currentStep);
  const completedRef = useRef(onboardingCompleted);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    completedRef.current = onboardingCompleted;
  }, [onboardingCompleted]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== 'background' || completedRef.current) {
        return;
      }

      void logActionEvent(ACTION_EVENTS.ONBOARDING_ABANDONED, {
        last_step: currentStepRef.current,
        reason: 'app_background',
      });
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  return null;
}
