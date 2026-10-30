import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearMissingRelation,
  isMissingRelationError,
  noteRelationError,
  relationAvailable,
} from './schemaAvailability';

test('detects PostgREST missing-table errors', () => {
  assert.equal(
    isMissingRelationError({
      code: 'PGRST205',
      message: "Could not find the table 'public.daily_letters' in the schema cache",
    }),
    true,
  );
  assert.equal(isMissingRelationError({ code: '42703', message: 'column does not exist' }), false);
});

test('remembers a missing relation after the first error', () => {
  assert.equal(relationAvailable('daily_letters_test'), true);
  assert.equal(
    noteRelationError('daily_letters_test', {
      code: 'PGRST205',
      message: "Could not find the table 'public.daily_letters_test' in the schema cache",
    }),
    true,
  );
  assert.equal(relationAvailable('daily_letters_test'), false);
});

test('clearing a missing relation allows another attempt', () => {
  noteRelationError('activity_sessions_test', {
    code: 'PGRST205',
    message: "Could not find the table 'public.activity_sessions_test' in the schema cache",
  });
  assert.equal(relationAvailable('activity_sessions_test'), false);
  clearMissingRelation('activity_sessions_test');
  assert.equal(relationAvailable('activity_sessions_test'), true);
});
