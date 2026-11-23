import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  canSendChat,
  isSubscriptionEntitled,
  type SubscriptionAccess,
} from '@/billing/entitlement';
import {
  EMPTY_FREE_CHAT_QUOTA,
  parseFreeChatQuota,
  type FreeChatQuota,
} from '@/billing/freeQuota';
import { FALLBACK_PLAN_PRICES, type PlanPrices } from '@/billing/prices';
import type { BillingInterval } from '@/billing/products';
import {
  PurchaseCancelled,
  loadPremiumPricesOnce,
  openSubscriptionManagement,
  purchasePremium,
  restorePremiumPurchases,
  restorePremiumPurchasesOnce,
} from '@/billing/storePurchases';
import { isDeveloperEmail } from '@/constants/developerAccess';
import { useAuth } from '@/contexts/AuthContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { supabase } from '@/integrations/supabase/client';

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

const EMPTY_ACCESS: SubscriptionAccess = {
  planId: 'free',
  status: 'free',
  currentPeriodEnd: null,
  freeConversationId: null,
};

function asPlanId(value: string | null): PlanId {
  if (value === 'reflexivo' || value === 'profundo') return value;
  return 'free';
}

function asPlanStatus(value: string | null): PlanStatus {
  if (
    value === 'trialing' ||
    value === 'active' ||
    value === 'canceled' ||
    value === 'past_due'
  ) {
    return value;
  }
  return 'free';
}

async function fetchFreeChatQuota(): Promise<FreeChatQuota> {
  try {
    const { data, error } = await supabase.functions.invoke('free-chat-quota', {
      method: 'POST',
      body: {},
    });
    if (error || !data) return EMPTY_FREE_CHAT_QUOTA;
    return parseFreeChatQuota(data);
  } catch {
    // Offline / function not deployed yet — leave chat open; server still decides on send.
    return EMPTY_FREE_CHAT_QUOTA;
  }
}

export function useUserPlan() {
  const { user } = useAuth();
  const { isInstitution } = useAppAudience();
  const userId = user?.id ?? null;
  const developer = isDeveloperEmail(user?.email);
  const [access, setAccess] = useState<SubscriptionAccess>(EMPTY_ACCESS);
  const [quota, setQuota] = useState<FreeChatQuota>(EMPTY_FREE_CHAT_QUOTA);
  const [storeProductId, setStoreProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [prices, setPrices] = useState<PlanPrices>(FALLBACK_PLAN_PRICES);

  const refetch = useCallback(async () => {
    if (!userId) {
      setAccess(EMPTY_ACCESS);
      setQuota(EMPTY_FREE_CHAT_QUOTA);
      setStoreProductId(null);
      setIsLoading(false);
      return;
    }
    const [{ data, error }, nextQuota] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('plan_id, status, current_period_end, free_conversation_id, store_product_id')
        .eq('user_id', userId)
        .maybeSingle(),
      fetchFreeChatQuota(),
    ]);
    if (error || !data) {
      setAccess(EMPTY_ACCESS);
      setStoreProductId(null);
    } else {
      setAccess({
        planId: data.plan_id,
        status: data.status,
        currentPeriodEnd: data.current_period_end,
        freeConversationId: data.free_conversation_id,
      });
      setStoreProductId(data.store_product_id);
    }
    setQuota(nextQuota);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  useEffect(() => {
    if (!userId || developer) return;
    let cancelled = false;
    void loadPremiumPricesOnce()
      .then((next) => {
        if (!cancelled) setPrices(next);
      })
      .catch(() => undefined);
    void restorePremiumPurchasesOnce()
      .then((restored) => {
        if (restored) return refetch();
        return undefined;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [developer, refetch, userId]);

  const storeEntitled = developer || isSubscriptionEntitled(access);
  const entitled = storeEntitled || isInstitution;
  const planId = entitled ? asPlanId(access.planId === 'free' ? 'profundo' : access.planId) : 'free';
  const status: PlanStatus = developer || isInstitution
    ? 'active'
    : entitled
      ? asPlanStatus(access.status)
      : 'free';

  const chatLiberado = canSendChat({ entitled, loading: isLoading, quota });
  const showQuotaBar = !entitled && !isLoading && chatLiberado && quota.cotaRestantePct > 0;

  const canSendInConversation = useCallback(
    (_conversationId: string | null) => chatLiberado,
    [chatLiberado],
  );

  const canAccess = useCallback(
    (feature: Feature): boolean => {
      if (developer || entitled) return true;
      return feature !== 'unlimited_messages' && feature !== 'unlimited_history';
    },
    [developer, entitled],
  );

  const startCheckout = useCallback(
    async (interval: BillingInterval) => {
      if (!userId) throw new Error('Entre na sua conta para assinar.');
      try {
        await purchasePremium(interval, userId);
      } catch (error) {
        if (error instanceof PurchaseCancelled) return false;
        throw error;
      }
      await refetch();
      return true;
    },
    [refetch, userId],
  );

  const restorePurchases = useCallback(async () => {
    const restored = await restorePremiumPurchases();
    await refetch();
    return restored || entitled;
  }, [entitled, refetch]);

  const manageSubscription = useCallback(async () => {
    await openSubscriptionManagement(storeProductId);
  }, [storeProductId]);

  return {
    planId,
    status,
    trialEndsAt: null,
    currentPeriodEnd: access.currentPeriodEnd ? new Date(access.currentPeriodEnd) : null,
    stripeCustomerId: null,
    effectivePlan: planId,
    isLoading,
    canAccess,
    trialDaysRemaining: null,
    canSendMessage: chatLiberado,
    canSendInConversation,
    /** TF-114: voice uses the same Free monthly quota as text. */
    canUseVoice: chatLiberado,
    chatLiberado,
    cotaRestantePct: entitled ? 100 : quota.cotaRestantePct,
    renovaEm: quota.renovaEm,
    showQuotaBar,
    remainingMessages: entitled ? Infinity : chatLiberado ? Infinity : 0,
    isLastFreeConversation: false,
    isQuotaExhausted: !entitled && !isLoading && !chatLiberado,
    /** Contextual chat shortcuts (insight / letter / activity deepen) need Premium. */
    requiresPremiumForContext: !entitled && !isLoading,
    incrementMessageCount: async () => {},
    refetch,
    startCheckout,
    restorePurchases,
    manageSubscription,
    prices,
    isSubscribed: entitled,
  };
}
