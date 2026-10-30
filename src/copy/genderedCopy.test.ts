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

test('activity copy follows user gender', () => {
  assert.equal(
    applyGenderedCopy('Um check-in rápido com você mesma', 'masculine'),
    'Um check-in rápido com você mesmo',
  );
  assert.equal(
    applyGenderedCopy('Um check-in rápido com você mesma', 'neutral'),
    'Um check-in rápido com você mesmo(a)',
  );
  assert.equal(
    applyGenderedCopy('Quando a gente está sobrecarregada, decide no automático.', 'masculine'),
    'Quando a gente está sobrecarregado, decide no automático.',
  );
  assert.equal(
    applyGenderedCopy('Continuar curiosa, mesmo quando já parece que você deveria saber.', 'masculine'),
    'Continuar curioso, mesmo quando já parece que você deveria saber.',
  );
  assert.equal(
    applyGenderedCopy('Ser vista, escolhida, e ocupar um lugar que os outros notam.', 'masculine'),
    'Ser visto, escolhido, e ocupar um lugar que os outros notam.',
  );
  assert.equal(applyGenderedCopy('Nublada', 'masculine'), 'Nublado');
  assert.equal(applyGenderedCopy('Dispersa', 'masculine'), 'Disperso');
  assert.equal(applyGenderedCopy('Distraída', 'masculine'), 'Distraído');
  assert.equal(applyGenderedCopy('Cansada', 'masculine'), 'Cansado');
  assert.equal(applyGenderedCopy('Confusa', 'masculine'), 'Confuso');
  assert.equal(applyGenderedCopy('Energizada', 'masculine'), 'Energizado');
  assert.equal(applyGenderedCopy('Relaxada', 'masculine'), 'Relaxado');
  assert.equal(applyGenderedCopy('Curiosa', 'masculine'), 'Curioso');
  assert.equal(applyGenderedCopy('Bloqueada', 'masculine'), 'Bloqueado');
  assert.equal(applyGenderedCopy('Esperançosa', 'masculine'), 'Esperançoso');
  assert.equal(applyGenderedCopy('Solitária', 'masculine'), 'Solitário');
  assert.equal(applyGenderedCopy('Apoiada', 'masculine'), 'Apoiado');
  assert.equal(applyGenderedCopy('Focada', 'masculine'), 'Focado');
  assert.equal(applyGenderedCopy('Irritada', 'masculine'), 'Irritado');
  assert.equal(applyGenderedCopy('Descansada', 'masculine'), 'Descansado');
  assert.equal(applyGenderedCopy('Calma', 'masculine'), 'Calmo');
  assert.equal(applyGenderedCopy('Mais calma', 'masculine'), 'Mais calmo');
  assert.equal(applyGenderedCopy('Afiada', 'masculine'), 'Afiado');
  assert.equal(applyGenderedCopy('Inspirada', 'masculine'), 'Inspirado');
  assert.equal(applyGenderedCopy('Criativa', 'masculine'), 'Criativo');
  assert.equal(applyGenderedCopy('Grata', 'masculine'), 'Grato');
  assert.equal(applyGenderedCopy('Valorizada', 'masculine'), 'Valorizado');
  assert.equal(applyGenderedCopy('Esgotada', 'masculine'), 'Esgotado');
  assert.equal(applyGenderedCopy('Inquieta', 'masculine'), 'Inquieto');
  assert.equal(applyGenderedCopy('Frustrada', 'masculine'), 'Frustrado');
  assert.equal(applyGenderedCopy('Retraída', 'masculine'), 'Retraído');
});

test('does not rewrite words that only contain a gendered form', () => {
  assert.equal(
    applyGenderedCopy('Como estava sua cabeça durante o treino?', 'masculine'),
    'Como estava sua cabeça durante o treino?',
  );
  assert.equal(applyGenderedCopy('Dura', 'masculine'), 'Duro');
  assert.equal(
    applyGenderedCopy('uma decisão travada', 'masculine'),
    'uma decisão travada',
  );
});
