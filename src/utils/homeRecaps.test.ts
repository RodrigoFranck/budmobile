import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isUsableRecapBody,
  isUsableRecapFragment,
  looksLikeAppTriggerMessage,
  looksLikeFixedRecapTemplate,
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
});

test('rejects greetings, app-talk, tiny phrases and crisis speech as fragments', () => {
  assert.equal(isUsableRecapFragment('Fala, Bud. Tudo bem?'), false);
  assert.equal(isUsableRecapFragment('oi'), false);
  assert.equal(isUsableRecapFragment('Quero continuar nossa conversa de ontem'), false);
  assert.equal(isUsableRecapFragment('Não sei. Tô aqui pra falar com você.'), false);
  assert.equal(isUsableRecapFragment('Quero me matar'), false);
  assert.equal(isUsableRecapFragment('Só descanso quando a lista acaba.'), true);
  assert.equal(recapQuote('Fala, Bud. Tudo bem?', 'Só descanso quando a lista acaba.'), 'Só descanso quando a lista acaba.');
  assert.equal(recapQuote('Quero me matar', 'tema de risco'), '');
});

test('rejects trigger messages as fragments (TF-100)', () => {
  assert.equal(
    looksLikeAppTriggerMessage('Quero conversar sobre "Entre o peso da prova".'),
    true,
  );
  assert.equal(
    isUsableRecapFragment('Quero conversar sobre "Entre o peso da prova".'),
    false,
  );
  assert.equal(
    recapQuote('Quero conversar sobre "Entre o peso da…', 'Só descanso quando a lista acaba.'),
    'Só descanso quando a lista acaba.',
  );
  assert.equal(
    recapQuote('“Só descanso quando a lista acaba.”', 'título'),
    'Só descanso quando a lista acaba.',
  );
});

test('rejects the fixed Para começar template as card body (TF-67)', () => {
  assert.equal(
    looksLikeFixedRecapTemplate(
      'Isso ficou de semana passada. Quer conversar sobre o que ainda está aberto nisso?',
    ),
    true,
  );
  assert.equal(
    isUsableRecapBody(
      'Isso ficou de ontem. Quer conversar sobre o que ainda está aberto nisso?',
    ),
    false,
  );
  assert.equal(
    isUsableRecapBody(
      'Você contou que só se permite parar quando tudo está feito. Nos dias em que a lista não acaba, o descanso fica para depois. Quer olhar para o que essa regra protege?',
    ),
    true,
  );
  // recapInvite still exists for legacy callers but must not power cards
  assert.equal(looksLikeFixedRecapTemplate(recapInvite('Ontem')), true);
});
