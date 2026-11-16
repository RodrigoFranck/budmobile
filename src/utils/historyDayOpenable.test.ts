import assert from 'node:assert/strict';
import { test } from 'node:test';

import { historyDayIsLetterOnly, historyDayIsOpenable } from './historyDayOpenable';

test('letter-only day is openable to read the letter', () => {
  const letterOnly = { messageCount: 0, hasLetter: true, activities: [] };
  assert.equal(historyDayIsLetterOnly(letterOnly), true);
  assert.equal(historyDayIsOpenable(letterOnly), true);
});

test('day with conversation is openable', () => {
  const withChat = { messageCount: 3, hasLetter: true, activities: [] };
  assert.equal(historyDayIsLetterOnly(withChat), false);
  assert.equal(historyDayIsOpenable(withChat), true);
});

test('day with activity only is openable', () => {
  const withActivity = {
    messageCount: 0,
    hasLetter: false,
    activities: [{ id: 'fiee' }],
  };
  assert.equal(historyDayIsOpenable(withActivity), true);
  assert.equal(historyDayIsLetterOnly(withActivity), false);
});

test('empty day is not openable', () => {
  const empty = { messageCount: 0, hasLetter: false, activities: [] };
  assert.equal(historyDayIsOpenable(empty), false);
  assert.equal(historyDayIsLetterOnly(empty), false);
});
