import { useCallback, useEffect, useState } from 'react';

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

type StubPlan = { status: PlanStatus; planId: PlanId };

let stubPlan: StubPlan = { status: 'free', planId: 'free' };
const stubListeners = new Set<() => void>();

function subscribeStub(listener: () => void) {
  stubListeners.add(listener);
  return () => {
    stubListeners.delete(listener);
  };
}

function writeStub(next: StubPlan) {
  stubPlan = next;
  stubListeners.forEach((listener) => listener());
}

export function useUserPlan() {
  const [plan, setPlan] = useState<StubPlan>(stubPlan);

  useEffect(() => subscribeStub(() => setPlan(stubPlan)), []);

  const startCheckout = useCallback(async (_interval: 'monthly' | 'annual') => {
    writeStub({ status: 'active', planId: 'profundo' });
  }, []);

  const restorePurchases = useCallback(async () => {
    if (stubPlan.status === 'active' || stubPlan.status === 'trialing') return true;
    return false;
  }, []);

  const canAccess = useCallback((_feature: Feature): boolean => true, []);
  const incrementMessageCount = useCallback(async () => {}, []);
  const refetch = useCallback(async () => {}, []);

  const isSubscribed = plan.status === 'active' || plan.status === 'trialing';
  const remainingMessages = isSubscribed ? Infinity : 1;
  const canSendMessage = isSubscribed || remainingMessages > 0;
  const isLastFreeConversation = !isSubscribed && remainingMessages === 1;

  return {
    planId: plan.planId,
    status: plan.status,
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    effectivePlan: plan.planId,
    isLoading: false,
    canAccess,
    trialDaysRemaining: null,
    canSendMessage,
    remainingMessages,
    isLastFreeConversation,
    incrementMessageCount,
    refetch,
    startCheckout,
    restorePurchases,
  };
}
