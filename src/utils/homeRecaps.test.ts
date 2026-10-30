import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  nextRecapPile,
  recapCandidateIds,
  recapInvite,
  recapQuote,
} from './homeRecaps';

const conversation = (
  id: string,
  day: string,
  title = `Conversa ${id}`,
) => ({
  id,
  title,
  conversation_date: day,
  created_at: `${day}T12:00:00.000Z`,
});

test('keeps recaps in the last two weeks and skips today', () => {
  const ids = recapCandidateIds({
    today: '2026-10-29',
    conversations: [
      conversation('today', '2026-10-29'),
      conversation('yesterday', '2026-10-28'),
      conversation('week', '2026-10-22'),
      conversation('old', '2026-10-01'),
      conversation('untitled', '2026-10-27', ''),
    ],
  });
  assert.deepEqual(ids, ['yesterday', 'week']);
});

test('adds at most three new cards a day and keeps a pile of ten', () => {
  const candidates = Array.from({ length: 12 }, (_, index) => `c${index + 1}`);
  const firstDay = nextRecapPile({
    pile: [],
    candidateIds: candidates,
    today: '2026-10-28',
  });
  assert.deepEqual(
    firstDay.map((item) => item.id),
    ['c1', 'c2', 'c3'],
  );

  const secondDay = nextRecapPile({
    pile: firstDay,
    candidateIds: candidates,
    today: '2026-10-29',
  });
  assert.deepEqual(
    secondDay.map((item) => item.id),
    ['c4', 'c5', 'c6', 'c1', 'c2', 'c3'],
  );

  const sameDay = nextRecapPile({
    pile: secondDay,
    candidateIds: candidates,
    today: '2026-10-29',
  });
  assert.deepEqual(
    sameDay.map((item) => item.id),
    ['c4', 'c5', 'c6', 'c1', 'c2', 'c3'],
  );
});

test('drops pile items that left the candidate window', () => {
  const pile = nextRecapPile({
    pile: [
      { id: 'gone', addedOn: '2026-10-20' },
      { id: 'kept', addedOn: '2026-10-27' },
    ],
    candidateIds: ['fresh', 'kept'],
    today: '2026-10-29',
  });
  assert.deepEqual(
    pile.map((item) => item.id),
    ['fresh', 'kept'],
  );
});

test('uses a literal fragment as the card quote', () => {
  assert.equal(
    recapQuote('  “Só descanso quando a lista acaba.”  ', 'título'),
    'Só descanso quando a lista acaba.',
  );
  assert.equal(recapInvite('Ontem'), 'Isso ficou de ontem. Quer conversar sobre o que ainda está aberto nisso?');
});
