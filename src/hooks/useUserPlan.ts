import { useCallback, useState } from 'react';

export type PlanId = 'free' | 'reflexivo' | 'profundo';
export type PlanStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'free';

export interface UserPlan {
  planId: PlanId;
  status: PlanStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
}

export type Feature =
  | 'unlimited_messages'
  | 'yesterday_journey'
  | 'inspired_insight'
  | 'frequency_insight'
  | 'habit_insight'
  | 'deep_insight'
  | 'voice_mode'
  | 'unlimited_history';

export function useUserPlan() {
  const [status, setStatus] = useState<PlanStatus>('active');
  const [planId, setPlanId] = useState<PlanId>('profundo');

  const startCheckout = useCallback(async (_interval: 'monthly' | 'annual') => {
    setStatus('active');
    setPlanId('profundo');
  }, []);

  const canAccess = useCallback((_feature: Feature): boolean => true, []);
  const incrementMessageCount = useCallback(async () => {}, []);
  const refetch = useCallback(async () => {}, []);

  return {
    planId,
    status,
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    effectivePlan: planId,
    isLoading: false,
    canAccess,
    trialDaysRemaining: null,
    canSendMessage: true,
    remainingMessages: Infinity,
    incrementMessageCount,
    refetch,
    startCheckout,
  };
}
