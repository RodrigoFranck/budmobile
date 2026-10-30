import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatDailyLetterPlain,
  isUsableLetterInsight,
  parseDailyLetterBody,
  resolveDailyLetter,
  YESTERDAY_CARD_QUOTE,
} from './dailyLetter';

const stored = {
  id: 'row-1',
  letter_date: '2026-10-29',
  title: 'Você não precisa resolver tudo hoje',
  body: JSON.stringify({
    opening: 'Oi, Marina. Você só descansa quando a lista acaba.',
    noticed: 'Nos dias em que você parou dez minutos, o sono veio mais fácil.',
    takeaway: 'Hoje, escolha uma única coisa da lista que pode esperar.',
  }),
  opened_at: null,
  source: 'global_context',
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

test('parses structured letter JSON and keeps legacy plain text as opening', () => {
  const parsed = parseDailyLetterBody(stored.body);
  assert.equal(parsed.opening.startsWith('Oi, Marina.'), true);
  assert.equal(parsed.noticed.includes('dez minutos'), true);
  assert.equal(parsed.takeaway.includes('única coisa'), true);

  const legacy = parseDailyLetterBody('Fiquei pensando no que você disse ontem.');
  assert.equal(legacy.opening, 'Fiquei pensando no que você disse ontem.');
  assert.equal(legacy.noticed, '');
  assert.equal(legacy.takeaway, '');
});

test('formats the letter for share and chat handoff', () => {
  const text = formatDailyLetterPlain(stored.title, parseDailyLetterBody(stored.body));
  assert.match(text, /Você não precisa resolver tudo hoje/);
  assert.match(text, /O que eu percebi/);
  assert.match(text, /Pra levar com você/);
  assert.match(text, /Com cuidado, Bud\./);
});
