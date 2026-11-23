import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canSendChat, canSendInFreeConversation, isSubscriptionEntitled } from './entitlement';
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

test('Free chat send follows server chat_liberado (monthly quota)', () => {
  assert.equal(
    canSendChat({
      entitled: false,
      quota: { chatLiberado: true, cotaRestantePct: 60, renovaEm: null },
    }),
    true,
  );
  assert.equal(
    canSendChat({
      entitled: false,
      quota: { chatLiberado: false, cotaRestantePct: 0, renovaEm: null },
    }),
    false,
  );
  assert.equal(
    canSendChat({
      entitled: true,
      quota: { chatLiberado: false, cotaRestantePct: 0, renovaEm: null },
    }),
    true,
  );
});

test('legacy free-conversation helper kept for migration coverage', () => {
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
      conversationId: 'conv-2',
    }),
    false,
  );
});

test('store product ids map to the paywall intervals', () => {
  assert.equal(isPremiumProductId('premium_anual_2'), true);
  assert.equal(isPremiumProductId('premium_mensal_2'), true);
  assert.equal(isPremiumProductId('premium_anual'), true);
  assert.equal(isPremiumProductId('premium_mensal'), true);
  assert.equal(isPremiumProductId('com.other.app'), false);
  assert.equal(intervalForProductId('premium_anual_2'), 'annual');
  assert.equal(intervalForProductId('premium_mensal_2'), 'monthly');
  assert.equal(intervalForProductId('premium_anual'), 'annual');
  assert.equal(formatYearlyAsMonthly(419.9, 'BRL').includes('34,99'), true);
});
