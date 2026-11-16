import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  HEALTH_SURVEY_QUESTION_COUNT,
  persistableAnswers,
  visibleHealthSurveySteps,
} from './healthSurvey';

test('counts 23 catalog questions', () => {
  assert.equal(HEALTH_SURVEY_QUESTION_COUNT, 23);
});

test('skips productivity when worked hours are 0', () => {
  const steps = visibleHealthSurveySteps({
    trabalho_employed: 'Sim',
    trabalho_hours: '0',
  });
  assert.equal(
    steps.some((step) => step.key === 'trabalho_productivity'),
    false,
  );
  assert.equal(
    steps.some((step) => step.key === 'trabalho_daily'),
    true,
  );
});

test('keeps productivity when worked hours are above 0', () => {
  const steps = visibleHealthSurveySteps({
    trabalho_employed: 'Sim',
    trabalho_hours: '8',
  });
  assert.equal(
    steps.some((step) => step.key === 'trabalho_productivity'),
    true,
  );
});

test('omits productivity from persisted answers when hours are 0', () => {
  const stored = persistableAnswers({
    vas: '70',
    trabalho_employed: 'Sim',
    trabalho_missed: '0',
    trabalho_other: '0',
    trabalho_hours: '0',
    trabalho_productivity: '4',
    trabalho_daily: '2',
  });
  assert.equal(stored.trabalho_productivity, undefined);
  assert.equal(stored.trabalho_daily, '2');
});

test('last visible step remains trabalho_daily when productivity is skipped', () => {
  const steps = visibleHealthSurveySteps({
    trabalho_employed: 'Sim',
    trabalho_hours: '0',
  });
  assert.equal(steps.at(-1)?.key, 'trabalho_daily');
  assert.equal(
    steps.some((step) => step.key === 'trabalho_productivity'),
    false,
  );
});

test('last visible step is trabalho_daily when productivity is kept', () => {
  const steps = visibleHealthSurveySteps({
    trabalho_employed: 'Sim',
    trabalho_hours: '8',
  });
  assert.equal(steps.at(-1)?.key, 'trabalho_daily');
  assert.equal(steps.some((step) => step.key === 'trabalho_productivity'), true);
});
