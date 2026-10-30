import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isUsableLetterInsight, resolveDailyLetter, YESTERDAY_CARD_QUOTE } from './dailyLetter';

const stored = {
  id: 'row-1',
  letter_date: '2026-10-29',
  title: 'Você não precisa resolver tudo hoje',
  body: 'Marina, ontem a lista pesou mais do que o dia.',
  opened_at: null,
  source: 'nightly',
};

test('hides the letter without a yesterday conversation', () => {
  const result = resolveDailyLetter({
    today: '2026-10-29',
    hadYesterdayConversation: false,
    stored,
    insight: { title: 'Ontem', description: 'Texto', locked: false },
  });
  assert.equal(result.available, false);
  assert.equal(result.letter, null);
});

test('prefers the stored daily letter when the user talked yesterday', () => {
  const result = resolveDailyLetter({
    today: '2026-10-29',
    hadYesterdayConversation: true,
    stored,
  });
  assert.equal(result.available, true);
  assert.equal(result.letter?.id, 'row-1');
  assert.equal(result.letter?.body, stored.body);
});

test('falls back to the unlocked yesterday insight when the job row is missing', () => {
  const result = resolveDailyLetter({
    today: '2026-10-29',
    hadYesterdayConversation: true,
    stored: null,
    insight: { title: 'A lista não termina', description: 'Você só para quando acaba.', locked: false },
  });
  assert.equal(result.available, true);
  assert.equal(result.letter?.source, 'yesterday_insight');
  assert.equal(result.letter?.title, 'A lista não termina');
});

test('does not use locked Explore copy as a letter', () => {
  assert.equal(
    isUsableLetterInsight({
      title: 'Ainda estou te conhecendo',
      description: 'Quando a gente conversar, vou poder te trazer algo sobre como foi o dia anterior.',
      locked: true,
    }),
    false,
  );

  const result = resolveDailyLetter({
    today: '2026-10-29',
    hadYesterdayConversation: true,
    stored: null,
    insight: {
      title: 'Ainda estou te conhecendo',
      description: 'Quando a gente conversar, vou poder te trazer algo.',
      locked: false,
    },
  });
  assert.equal(result.available, false);
});

test('uses the card phrase when the insight has no title', () => {
  const result = resolveDailyLetter({
    today: '2026-10-29',
    hadYesterdayConversation: true,
    stored: null,
    insight: { title: '  ', description: 'Você falou da apresentação.', locked: false },
  });
  assert.equal(result.letter?.title, YESTERDAY_CARD_QUOTE);
});
