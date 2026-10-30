import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatDeclaredUserContext,
  joinPrefList,
} from './formatDeclaredUserContext';

test('joinPrefList ignores empty values', () => {
  assert.equal(joinPrefList(undefined), null);
  assert.equal(joinPrefList([]), null);
  assert.equal(joinPrefList(['Família', 'Amizades']), 'Família, Amizades');
});

test('declared context includes current preferences and skips blanks', () => {
  const text = formatDeclaredUserContext({
    name: 'Ana',
    age: '25 a 29',
    gender: 'Mulher',
    preferences: {
      therapy: 'Sim, faço agora',
      mood: 'Altos e baixos',
      focus: ['Me entender melhor', 'Dormir melhor'],
      faith: 'Um pouco',
    },
  });

  assert.match(text ?? '', /priorize isto/);
  assert.match(text ?? '', /Nome: Ana/);
  assert.match(text ?? '', /Terapia: Sim, faço agora/);
  assert.match(text ?? '', /No que vamos focar: Me entender melhor, Dormir melhor/);
  assert.doesNotMatch(text ?? '', /Neurodivergência/);
});

test('preference edits change the continuous context', () => {
  const before = formatDeclaredUserContext({
    name: 'Ana',
    preferences: { mood: 'Sem energia', focus: ['Lidar com estresse e ansiedade'] },
  });
  const after = formatDeclaredUserContext({
    name: 'Ana',
    preferences: { mood: 'Levando', focus: ['Ganhar confiança'] },
  });

  assert.match(before ?? '', /Como tem se sentido: Sem energia/);
  assert.match(after ?? '', /Como tem se sentido: Levando/);
  assert.match(after ?? '', /Ganhar confiança/);
  assert.notEqual(before, after);
});

test('keeps the latest activity of each type', () => {
  const text = formatDeclaredUserContext({
    preferences: {},
    records: {
      activities: [
        {
          activityType: 'fiee',
          resultText: 'Forte · Clara · Leve · Conectada',
          responses: {},
          completedAt: '2026-10-28T12:00:00Z',
        },
        {
          activityType: 'fiee',
          resultText: 'versão antiga',
          responses: {},
          completedAt: '2026-10-01T12:00:00Z',
        },
        {
          activityType: 'cinco_porques',
          resultText: 'medo de errar',
          responses: { p1: 'estou travada', p5: 'medo de errar' },
          completedAt: '2026-10-27T12:00:00Z',
        },
      ],
      screenings: [],
      assessment: null,
      checkins: [],
    },
  });

  assert.match(text ?? '', /FIEE\? \(2026-10-28\)/);
  assert.match(text ?? '', /Forte · Clara · Leve · Conectada/);
  assert.match(text ?? '', /Cinco Porquês/);
  assert.doesNotMatch(text ?? '', /versão antiga/);
});

test('formats health survey and screenings without numeric scores', () => {
  const text = formatDeclaredUserContext({
    preferences: {},
    records: {
      activities: [],
      screenings: [
        {
          instrument: 'health_survey',
          completedAt: '2026-10-20T00:00:00Z',
          responses: {
            qv_mobility: 'Não tenho problemas para andar',
            vas: '80',
          },
        },
        {
          instrument: 'gad7',
          completedAt: '2026-10-21T00:00:00Z',
          responses: {
            q1: 'Vários dias',
            q2: 'Nada',
          },
        },
      ],
      assessment: null,
      checkins: [],
    },
  });

  assert.match(text ?? '', /Pesquisa de saúde \(2026-10-20\)/);
  assert.match(text ?? '', /Mobilidade: Não tenho problemas para andar/);
  assert.match(text ?? '', /Como você tem se sentido \(2026-10-21\)/);
  assert.match(text ?? '', /Nervosismo, ansiedade ou tensão: Vários dias/);
  assert.doesNotMatch(text ?? '', /score/i);
});
