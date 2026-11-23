import type { FreeChatQuota } from '@/billing/freeQuota';
import { EMPTY_FREE_CHAT_QUOTA } from '@/billing/freeQuota';

export const PAYWALL_REQUIRED = 'paywall_required';

export type SubscriptionAccess = {
  planId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  /** @deprecated TF-111 replaces one free conversation with monthly token quota. */
  freeConversationId: string | null;
};

export function isSubscriptionEntitled(
  row: SubscriptionAccess | null | undefined,
  now = Date.now(),
): boolean {
  if (!row) return false;
  if (row.planId === 'free' || row.status === 'free' || !row.status) return false;

  const periodEnd = row.currentPeriodEnd ? Date.parse(row.currentPeriodEnd) : Number.NaN;
  const inPeriod = Number.isFinite(periodEnd) && periodEnd > now;

  if (row.status === 'active' || row.status === 'trialing') {
    if (!row.currentPeriodEnd) return true;
    return inPeriod;
  }

  if (row.status === 'canceled' || row.status === 'past_due') return inPeriod;
  return false;
}

/**
 * Free chat send/voice gate. Premium / institutional / loading → always allowed.
 * Free → trusts server `chat_liberado` only (never client token math).
 */
export function canSendChat(input: {
  entitled: boolean;
  loading?: boolean;
  quota: FreeChatQuota | null | undefined;
}): boolean {
  if (input.loading || input.entitled) return true;
  return (input.quota ?? EMPTY_FREE_CHAT_QUOTA).chatLiberado;
}

/**
 * @deprecated Prefer `canSendChat` (monthly quota). Kept for tests during migration.
 */
export function canSendInFreeConversation(input: {
  entitled: boolean;
  loading?: boolean;
  freeConversationId: string | null;
  conversationId: string | null;
}): boolean {
  if (input.loading || input.entitled) return true;
  if (!input.freeConversationId) return true;
  if (!input.conversationId) return true;
  return input.freeConversationId === input.conversationId;
}
