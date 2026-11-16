import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHAT_IMAGE_MARKER } from './chatImageMessage';
import {
  countDisplayableHistoryTurns,
  isDisplayableHistoryMessage,
} from './historyMessages';

test('rejects empty user/assistant content', () => {
  assert.equal(isDisplayableHistoryMessage({ role: 'user', content: '' }), false);
  assert.equal(isDisplayableHistoryMessage({ role: 'user', content: '   ' }), false);
  assert.equal(isDisplayableHistoryMessage({ role: 'assistant', content: null }), false);
});

test('accepts text and chat image markers', () => {
  assert.equal(isDisplayableHistoryMessage({ role: 'user', content: 'oi' }), true);
  assert.equal(
    isDisplayableHistoryMessage({
      role: 'user',
      content: `${CHAT_IMAGE_MARKER}11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/photo.jpg`,
    }),
    true,
  );
  assert.equal(
    isDisplayableHistoryMessage({ role: 'user', content: 'data:image/jpeg;base64,abc' }),
    true,
  );
});

test('counts only displayable user/assistant turns', () => {
  const count = countDisplayableHistoryTurns([
    { role: 'context', content: '{"title":"x"}' },
    { role: 'user', content: '' },
    { role: 'user', content: 'fala' },
    { role: 'assistant', content: 'resposta' },
    { role: 'assistant', content: '  ' },
  ]);
  assert.equal(count, 2);
});
