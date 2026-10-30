import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyGenderedCopy, genderVoiceFrom, optionsMatch } from './genderedCopy';

test('voice from profile gender', () => {
  assert.equal(genderVoiceFrom('Homem'), 'masculine');
  assert.equal(genderVoiceFrom('Mulher'), 'feminine');
  assert.equal(genderVoiceFrom('Não binário'), 'neutral');
  assert.equal(genderVoiceFrom(''), 'neutral');
});

test('onboarding name follows gender', () => {
  assert.equal(applyGenderedCopy('chamada', 'masculine'), 'chamado');
  assert.equal(applyGenderedCopy('chamada', 'feminine'), 'chamada');
  assert.equal(applyGenderedCopy('chamada', 'neutral'), 'chamado(a)');
  assert.equal(applyGenderedCopy('Como você quer ser chamada?', 'masculine'), 'Como você quer ser chamado?');
});

test('health survey and safety copy', () => {
  assert.equal(
    applyGenderedCopy('Não estou ansiosa ou deprimida', 'masculine'),
    'Não estou ansioso ou deprimido',
  );
  assert.equal(
    applyGenderedCopy('Ficou internada em um hospital por pelo menos uma noite?', 'masculine'),
    'Ficou internado em um hospital por pelo menos uma noite?',
  );
  assert.equal(applyGenderedCopy('Estou pronta', 'masculine'), 'Estou pronto');
  assert.equal(applyGenderedCopy('Você não está sozinho', 'feminine'), 'Você não está sozinha');
  assert.equal(applyGenderedCopy('Você não está sozinho', 'neutral'), 'Você não está sozinho(a)');
});

test('relation map copy follows gender', () => {
  assert.equal(
    applyGenderedCopy('Poder ser eu mesma perto de Júlia', 'masculine'),
    'Poder ser eu mesmo perto de Júlia',
  );
  assert.equal(
    applyGenderedCopy('Ter momentos leves e divertidos juntas', 'masculine'),
    'Ter momentos leves e divertidos juntos',
  );
  assert.equal(
    applyGenderedCopy('Somos parceiras, de igual pra igual', 'masculine'),
    'Somos parceiros, de igual pra igual',
  );
  assert.equal(
    applyGenderedCopy('Poder ser eu mesma perto de Júlia', 'neutral'),
    'Poder ser eu mesmo(a) perto de Júlia',
  );
});

test('option matching across voices', () => {
  assert.equal(optionsMatch('Mais calma', 'Mais calmo'), true);
  assert.equal(optionsMatch('Cansada', 'Cansado(a)'), true);
  assert.equal(optionsMatch('Livros', 'Filmes'), false);
});
