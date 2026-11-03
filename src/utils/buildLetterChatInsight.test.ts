import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildLetterChatInsight, DAILY_LETTER_INSIGHT_TYPE } from './buildLetterChatInsight';

test('builds carta chat insight with origin and opening message', () => {
  const insight = buildLetterChatInsight({
    letterId: 'letter-1',
    title: 'Você não precisa resolver tudo hoje',
    opening: 'Oi, Marina. A lista nunca acaba.',
    shareText: 'Carta completa aqui.',
  });

  assert.equal(insight.insightType, DAILY_LETTER_INSIGHT_TYPE);
  assert.equal(insight.badge, 'CARTA DE HOJE');
  assert.match(insight.internalContext, /conversa\.origem = carta/);
  assert.match(insight.internalContext, /carta_id: letter-1/);
  assert.match(insight.internalContext, /Carta completa aqui/);
  assert.equal(
    insight.initialUserMessage,
    'Quero conversar sobre a carta de hoje: "Você não precisa resolver tudo hoje".',
  );
});
