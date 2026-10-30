import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyGenderedCopy } from './genderedCopy';
import { firstGivenName, inferNameVoice } from './nameGender';
import {
  applyPersonGenderedCopy,
  relationBondWord,
  relationMapInternalContext,
  relationMapResultText,
  resolveRelationType,
} from './relationPersonCopy';

test('first given name skips particles', () => {
  assert.equal(firstGivenName('João da Silva'), 'João');
  assert.equal(firstGivenName('Ana-Clara Souza'), 'Ana');
  assert.equal(firstGivenName('  Fábio Henrique  '), 'Fábio');
});

test('infers gender from clearly gendered Portuguese names', () => {
  assert.equal(inferNameVoice('Fábio'), 'masculine');
  assert.equal(inferNameVoice('Rodrigo'), 'masculine');
  assert.equal(inferNameVoice('Pedro'), 'masculine');
  assert.equal(inferNameVoice('José'), 'masculine');
  assert.equal(inferNameVoice('João Pedro'), 'masculine');
  assert.equal(inferNameVoice('Lucas'), 'masculine');
  assert.equal(inferNameVoice('Kauã'), 'masculine');
  assert.equal(inferNameVoice('Luca'), 'masculine');

  assert.equal(inferNameVoice('Júlia'), 'feminine');
  assert.equal(inferNameVoice('Maria'), 'feminine');
  assert.equal(inferNameVoice('Ana Clara'), 'feminine');
  assert.equal(inferNameVoice('Alice'), 'feminine');
  assert.equal(inferNameVoice('Beatriz'), 'feminine');
});

test('leaves unisex or unknown names unresolved', () => {
  assert.equal(inferNameVoice('Alex'), null);
  assert.equal(inferNameVoice('Dominique'), null);
  assert.equal(inferNameVoice(''), null);
  assert.equal(inferNameVoice('   '), null);
});

test('resolves parent, child and sibling labels from name gender', () => {
  assert.equal(resolveRelationType('Mãe ou pai', 'masculine'), 'Pai');
  assert.equal(resolveRelationType('Mãe ou pai', 'feminine'), 'Mãe');
  assert.equal(resolveRelationType('Mãe ou pai', null), 'Mãe ou pai');
  assert.equal(resolveRelationType('Filho ou filha', 'masculine'), 'Filho');
  assert.equal(resolveRelationType('Filho ou filha', 'feminine'), 'Filha');
  assert.equal(resolveRelationType('Irmão ou irmã', 'masculine'), 'Irmão');
  assert.equal(resolveRelationType('Irmão ou irmã', 'feminine'), 'Irmã');
  assert.equal(resolveRelationType('Amizade próxima', 'masculine'), 'Amizade próxima');
});

test('person copy switches ela/dela for a masculine name', () => {
  assert.equal(
    applyPersonGenderedCopy('Às vezes, quando acho que ela está ocupada', 'masculine'),
    'Às vezes, quando acho que ele está ocupado',
  );
  assert.equal(applyPersonGenderedCopy('Ela também se abre', 'masculine'), 'Ele também se abre');
  assert.equal(applyPersonGenderedCopy('Qual é o nome dela?', 'masculine'), 'Qual é o nome dele?');
});

test('Fábio as parent becomes Pai in the insight line', () => {
  const mapped = relationMapResultText({
    tipo: 'Mãe ou pai',
    nome: 'Fábio',
    papel: 'Muda bastante, depende do momento',
    frequencia: 'Quase sempre guardo pra mim',
    userVoice: 'feminine',
  });
  assert.equal(mapped.displayTipo, 'Pai');
  assert.equal(mapped.personVoice, 'masculine');
  assert.equal(
    mapped.resultText,
    'Pai · Fábio · Muda bastante, depende do momento · Quase sempre guardo pra mim',
  );

  const internal = relationMapInternalContext({
    tipo: 'Mãe ou pai',
    displayTipo: mapped.displayTipo,
    nome: 'Fábio',
    idade: '62',
    papel: 'Muda bastante, depende do momento',
    frequencia: 'Quase sempre guardo pra mim',
    personVoice: mapped.personVoice,
    userVoice: 'feminine',
  });
  assert.match(internal, /Fábio é o pai da pessoa que está falando/);
  assert.match(internal, /masculino/);
  assert.match(internal, /Nunca use ela\/dela para Fábio/);
});

test('family relations use relação instead of amizade', () => {
  assert.equal(relationBondWord('Mãe ou pai'), 'relação');
  assert.equal(relationBondWord('Pai'), 'relação');
  assert.equal(relationBondWord('Amizade próxima'), 'amizade');
});

test('user-gendered ranking still applies on top of the name', () => {
  assert.equal(
    applyGenderedCopy('Poder ser eu mesma perto de Fábio', 'masculine'),
    'Poder ser eu mesmo perto de Fábio',
  );
});
