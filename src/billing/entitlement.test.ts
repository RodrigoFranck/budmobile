import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canSendInFreeConversation, isSubscriptionEntitled } from './entitlement';
import { formatYearlyAsMonthly } from './prices';
import { intervalForProductId, isPremiumProductId } from './products';

const now = Date.parse('2026-11-05T12:00:00.000Z');

test('free and expired rows are not entitled', () => {
  assert.equal(isSubscriptionEntitled(null, now), false);
  assert.equal(
    isSubscriptionEntitled({ planId: 'free', status: 'free', currentPeriodEnd: null, freeConversationId: null }, now),
    false,
  );
  assert.equal(
    isSubscriptionEntitled(
      {
        planId: 'profundo',
        status: 'active',
        currentPeriodEnd: '2026-11-01T00:00:00.000Z',
        freeConversationId: null,
      },
      now,
    ),
    false,
  );
});

test('active and canceled-in-period rows stay entitled', () => {
  assert.equal(
    isSubscriptionEntitled(
      {
        planId: 'profundo',
        status: 'active',
        currentPeriodEnd: '2026-12-05T00:00:00.000Z',
        freeConversationId: null,
      },
      now,
    ),
    true,
  );
  assert.equal(
    isSubscriptionEntitled(
      {
        planId: 'profundo',
        status: 'canceled',
        currentPeriodEnd: '2026-12-05T00:00:00.000Z',
        freeConversationId: null,
      },
      now,
    ),
    true,
  );
});

test('the first conversation stays free until another one starts', () => {
  assert.equal(
    canSendInFreeConversation({
      entitled: false,
      freeConversationId: null,
      conversationId: 'conv-1',
    }),
    true,
  );
  assert.equal(
    canSendInFreeConversation({
      entitled: false,
      freeConversationId: 'conv-1',
      conversationId: 'conv-1',
    }),
    true,
  );
  assert.equal(
    canSendInFreeConversation({
      entitled: false,
      freeConversationId: 'conv-1',
      conversationId: 'conv-2',
    }),
    false,
  );
});

test('store product ids map to the paywall intervals', () => {
  assert.equal(isPremiumProductId('premium_anual'), true);
  assert.equal(isPremiumProductId('premium_mensal'), true);
  assert.equal(isPremiumProductId('com.other.app'), false);
  assert.equal(intervalForProductId('premium_anual'), 'annual');
  assert.equal(formatYearlyAsMonthly(459.9, 'BRL').includes('38,33'), true);
});
