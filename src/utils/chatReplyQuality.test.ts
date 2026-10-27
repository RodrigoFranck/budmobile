import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveChatTextRequestUrls, resolveChatTextUrl } from './chatFunctionsUrl';
import { isIncompleteAssistantReply } from './chatReplyQuality';
import { extractAssistantContent, parseSseDataLine } from './chatStreamParse';
import { sanitizeAssistantPortuguese } from './portugueseText';

test('complete short Bud replies are accepted', () => {
  assert.equal(isIncompleteAssistantReply('Entendi.'), false);
  assert.equal(isIncompleteAssistantReply('Entendi'), false);
  assert.equal(isIncompleteAssistantReply('Ah...'), false);
  assert.equal(isIncompleteAssistantReply('Como foi pra você?'), false);
});

test('empty or replacement characters are incomplete', () => {
  assert.equal(isIncompleteAssistantReply(''), true);
  assert.equal(isIncompleteAssistantReply('   '), true);
  assert.equal(isIncompleteAssistantReply('Você sentiu \uFFFD'), true);
});

test('dangling punctuation marks a cut reply', () => {
  assert.equal(isIncompleteAssistantReply('Você parece cansado,'), true);
  assert.equal(isIncompleteAssistantReply('O que isso abre:'), true);
  assert.equal(isIncompleteAssistantReply('A gente parou no-'), true);
});

test('last token without a vowel is incomplete', () => {
  assert.equal(isIncompleteAssistantReply('Isso mexeu com o ntr'), true);
  assert.equal(isIncompleteAssistantReply('Fica comigo n'), true);
});

test('unbalanced quotes are incomplete', () => {
  assert.equal(isIncompleteAssistantReply('Você disse "não aguento mais'), true);
});

test('sanitize accents and keeps esta', () => {
  assert.equal(
    sanitizeAssistantPortuguese('voce nao ja ate voces'),
    'você não já até vocês',
  );
  assert.equal(
    sanitizeAssistantPortuguese('esta sensação e essa acao'),
    'esta sensação e essa ação',
  );
  assert.equal(
    sanitizeAssistantPortuguese('**calma** agora'),
    'calma agora',
  );
});

test('chat functions url keeps remote supabase by default', () => {
  assert.equal(
    resolveChatTextUrl({
      functionsUrl: '',
      supabaseUrl: 'https://abc.supabase.co',
      os: 'ios',
    }),
    'https://abc.supabase.co/functions/v1/chat-text',
  );
});

test('chat functions url override points at local serve', () => {
  assert.equal(
    resolveChatTextUrl({
      functionsUrl: 'http://127.0.0.1:54321',
      supabaseUrl: 'https://abc.supabase.co',
      os: 'ios',
    }),
    'http://127.0.0.1:54321/functions/v1/chat-text',
  );
  assert.equal(
    resolveChatTextUrl({
      functionsUrl: 'http://127.0.0.1:54321',
      supabaseUrl: 'https://abc.supabase.co',
      os: 'android',
    }),
    'http://10.0.2.2:54321/functions/v1/chat-text',
  );
});

test('local chat functions url falls back to remote supabase', () => {
  assert.deepEqual(
    resolveChatTextRequestUrls({
      functionsUrl: 'http://127.0.0.1:54321',
      supabaseUrl: 'https://abc.supabase.co',
      os: 'ios',
    }),
    {
      primary: 'http://127.0.0.1:54321/functions/v1/chat-text',
      fallback: 'https://abc.supabase.co/functions/v1/chat-text',
    },
  );
});

test('remote chat functions url has no fallback', () => {
  assert.deepEqual(
    resolveChatTextRequestUrls({
      functionsUrl: '',
      supabaseUrl: 'https://abc.supabase.co',
      os: 'ios',
    }),
    {
      primary: 'https://abc.supabase.co/functions/v1/chat-text',
    },
  );
});

test('extracts JSON chat-text replies', () => {
  assert.equal(
    extractAssistantContent('{"content":"Oi, estou aqui."}'),
    'Oi, estou aqui.',
  );
});

test('extracts OpenAI SSE chat-text replies', () => {
  const body = [
    'data: {"choices":[{"delta":{"content":"Oi"}}]}',
    'data: {"choices":[{"delta":{"content":", Bud"}}]}',
    'data: [DONE]',
    '',
  ].join('\n');

  assert.equal(parseSseDataLine('data: {"choices":[{"delta":{"content":"Oi"}}]}'), 'Oi');
  assert.equal(extractAssistantContent(body), 'Oi, Bud');
});
