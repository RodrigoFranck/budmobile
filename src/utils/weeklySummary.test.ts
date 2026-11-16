import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canReadWeeklySummary,
  qualifyingConversationDays,
  resolveWeeklySummaryCard,
  WEEKLY_SUMMARY_MIN_COPY,
} from './weeklySummary';

const WEEK = '2026-11-02';

function at(iso: string) {
  return new Date(iso);
}

test('counts a user message day only inside Monday 00:00 and Sunday 16:00', () => {
  const days = qualifyingConversationDays(
    [
      '2026-11-02T03:00:00.000Z',
      '2026-11-02T18:00:00.000Z',
      '2026-11-04T15:00:00.000Z',
      '2026-11-08T18:59:00.000Z',
      '2026-11-08T19:00:00.000Z',
      '2026-11-09T12:00:00.000Z',
    ],
    WEEK,
  );

  assert.deepEqual(days, ['2026-11-02', '2026-11-04', '2026-11-08']);
});

test('one or zero conversation days stay blocked until the window closes', () => {
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-05T15:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 1,
      hasCachedSummary: false,
    }),
    'locked',
  );
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-08T15:59:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 0,
      hasCachedSummary: true,
    }),
    'locked',
  );
});

test('after Sunday 16:00, fewer than 2 days shows the minimum state', () => {
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-08T16:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 1,
      hasCachedSummary: true,
    }),
    'minimum',
  );
  assert.equal(
    WEEKLY_SUMMARY_MIN_COPY,
    'Converse em pelo menos 2 dias para receber seu resumo da semana',
  );
  assert.equal(
    canReadWeeklySummary({
      now: at('2026-11-08T18:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 1,
      hasCachedSummary: true,
    }),
    false,
  );
});

test('two days stay locked until Sunday 17:00 and then read the cache', () => {
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-08T16:40:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 2,
      hasCachedSummary: true,
    }),
    'locked',
  );
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-08T17:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 2,
      hasCachedSummary: false,
    }),
    'locked',
  );
  assert.equal(
    resolveWeeklySummaryCard({
      now: at('2026-11-08T17:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 2,
      hasCachedSummary: true,
    }),
    'ready',
  );
  assert.equal(
    canReadWeeklySummary({
      now: at('2026-11-08T17:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 2,
      hasCachedSummary: true,
    }),
    true,
  );
});

test('a previous week keeps its cached summary', () => {
  assert.equal(
    canReadWeeklySummary({
      now: at('2026-11-10T12:00:00-03:00'),
      weekStartKey: WEEK,
      qualifyingDays: 0,
      hasCachedSummary: true,
    }),
    true,
  );
});
