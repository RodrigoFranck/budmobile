import { useCallback } from "react";

export type PlanId = "free" | "reflexivo" | "profundo";
export type PlanStatus = "trialing" | "active" | "canceled" | "past_due" | "free";

export interface UserPlan {
  planId: PlanId;
  status: PlanStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
}

export type Feature =
  | "unlimited_messages"
  | "yesterday_journey"
  | "inspired_insight"
  | "frequency_insight"
  | "habit_insight"
  | "deep_insight"
  | "voice_mode"
  | "unlimited_history";

export function useUserPlan() {
  const canAccess = useCallback((_feature: Feature): boolean => true, []);

  const incrementMessageCount = useCallback(async () => {}, []);

  const refetch = useCallback(async () => {}, []);

  return {
    planId: "profundo" as PlanId,
    status: "active" as PlanStatus,
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    effectivePlan: "profundo" as PlanId,
    isLoading: false,
    canAccess,
    trialDaysRemaining: null,
    canSendMessage: true,
    remainingMessages: Infinity,
    incrementMessageCount,
    refetch,
  };
}
