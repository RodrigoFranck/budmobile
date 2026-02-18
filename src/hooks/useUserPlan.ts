import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayInBrasilia } from "@/utils/dateUtils";

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

const PLAN_FEATURES: Record<PlanId, Feature[]> = {
  free: ["yesterday_journey"],
  reflexivo: [
    "unlimited_messages",
    "yesterday_journey",
    "inspired_insight",
    "frequency_insight",
  ],
  profundo: [
    "unlimited_messages",
    "yesterday_journey",
    "inspired_insight",
    "frequency_insight",
    "habit_insight",
    "deep_insight",
    "voice_mode",
    "unlimited_history",
  ],
};

const FREE_DAILY_MESSAGE_LIMIT = 10;

export function useUserPlan() {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>({
    planId: "free",
    status: "free",
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setUserPlan({
        planId: "free",
        status: "free",
        trialEndsAt: null,
        currentPeriodEnd: null,
        stripeCustomerId: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        setIsLoading(false);
        return;
      }

      if (!subscription) {
        // No subscription record - user on free plan
        setUserPlan({
          planId: "free",
          status: "free",
          trialEndsAt: null,
          currentPeriodEnd: null,
          stripeCustomerId: null,
        });
      } else {
        // Check if trial has expired
        const trialEndsAt = subscription.trial_ends_at 
          ? new Date(subscription.trial_ends_at) 
          : null;
        const isTrialExpired = trialEndsAt && trialEndsAt < new Date();
        
        // If trialing and trial expired, treat as free
        if (subscription.status === "trialing" && isTrialExpired) {
          setUserPlan({
            planId: "free",
            status: "free",
            trialEndsAt,
            currentPeriodEnd: null,
            stripeCustomerId: subscription.stripe_customer_id,
          });
        } else {
          setUserPlan({
            planId: subscription.plan_id as PlanId,
            status: subscription.status as PlanStatus,
            trialEndsAt,
            currentPeriodEnd: subscription.current_period_end 
              ? new Date(subscription.current_period_end) 
              : null,
            stripeCustomerId: subscription.stripe_customer_id,
          });
        }
      }

      // Fetch daily message count (horário de Brasília)
      const today = getTodayInBrasilia();
      const { data: messageCount } = await supabase
        .from("daily_message_counts")
        .select("count")
        .eq("user_id", user.id)
        .eq("message_date", today)
        .maybeSingle();

      setDailyMessageCount(messageCount?.count || 0);
    } catch (error) {
      console.error("Error in fetchPlan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const getEffectivePlan = useCallback((): PlanId => {
    // If trialing or active, use the plan_id
    if (userPlan.status === "trialing" || userPlan.status === "active") {
      return userPlan.planId;
    }
    // Otherwise, free
    return "free";
  }, [userPlan]);

  const canAccess = useCallback((feature: Feature): boolean => {
    const effectivePlan = getEffectivePlan();
    return PLAN_FEATURES[effectivePlan].includes(feature);
  }, [getEffectivePlan]);

  const trialDaysRemaining = useCallback((): number | null => {
    if (userPlan.status !== "trialing" || !userPlan.trialEndsAt) {
      return null;
    }
    const now = new Date();
    const diffMs = userPlan.trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [userPlan]);

  const canSendMessage = useCallback((): boolean => {
    const effectivePlan = getEffectivePlan();
    if (effectivePlan !== "free") {
      return true;
    }
    return dailyMessageCount < FREE_DAILY_MESSAGE_LIMIT;
  }, [getEffectivePlan, dailyMessageCount]);

  const remainingMessages = useCallback((): number => {
    const effectivePlan = getEffectivePlan();
    if (effectivePlan !== "free") {
      return Infinity;
    }
    return Math.max(0, FREE_DAILY_MESSAGE_LIMIT - dailyMessageCount);
  }, [getEffectivePlan, dailyMessageCount]);

  const incrementMessageCount = useCallback(async () => {
    if (!user) return;

    const today = getTodayInBrasilia(); // horário de Brasília

    try {
      const { data: existing } = await supabase
        .from("daily_message_counts")
        .select("id, count")
        .eq("user_id", user.id)
        .eq("message_date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_message_counts")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id);
        setDailyMessageCount(existing.count + 1);
      } else {
        await supabase
          .from("daily_message_counts")
          .insert({ user_id: user.id, message_date: today, count: 1 });
        setDailyMessageCount(1);
      }
    } catch (error) {
      console.error("Error incrementing message count:", error);
    }
  }, [user]);

  return {
    ...userPlan,
    effectivePlan: getEffectivePlan(),
    isLoading,
    canAccess,
    trialDaysRemaining: trialDaysRemaining(),
    canSendMessage: canSendMessage(),
    remainingMessages: remainingMessages(),
    incrementMessageCount,
    refetch: fetchPlan,
  };
}

