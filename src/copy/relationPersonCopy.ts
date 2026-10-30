import { applyGenderedCopy, type GrammaticalVoice } from '@/copy/genderedCopy';
import { inferNameVoice } from '@/copy/nameGender';

const RELATION_TYPE_PAIRS: Record<string, { feminine: string; masculine: string }> = {
  'Mãe ou pai': { feminine: 'Mãe', masculine: 'Pai' },
  'Filho ou filha': { feminine: 'Filha', masculine: 'Filho' },
  'Irmão ou irmã': { feminine: 'Irmã', masculine: 'Irmão' },
};

function adaptCase(matched: string, target: string) {
  if (!matched || !target) return target;
  if (matched[0] === matched[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target.charAt(0).toLowerCase() + target.slice(1);
}

function replacePhrase(text: string, source: string, target: string) {
  const needle = source.toLowerCase();
  const lower = text.toLowerCase();
  const hits: number[] = [];
  let from = 0;
  while (from <= lower.length - needle.length) {
    const index = lower.indexOf(needle, from);
    if (index < 0) break;
    hits.push(index);
    from = index + needle.length;
  }
  let next = text;
  for (let i = hits.length - 1; i >= 0; i -= 1) {
    const index = hits[i];
    const matched = next.slice(index, index + source.length);
    next = `${next.slice(0, index)}${adaptCase(matched, target)}${next.slice(index + source.length)}`;
  }
  return next;
}

const PERSON_FORMS: Array<{ feminine: string; masculine: string }> = [
  { feminine: 'ela está ocupada', masculine: 'ele está ocupado' },
  { feminine: 'Ela também se abre', masculine: 'Ele também se abre' },
  { feminine: 'dela', masculine: 'dele' },
  { feminine: 'ela', masculine: 'ele' },
].sort((a, b) => b.feminine.length - a.feminine.length);

export function applyPersonGenderedCopy(
  text: string,
  voice: GrammaticalVoice | null,
): string {
  if (!voice || voice === 'feminine' || voice === 'neutral') return text;
  let next = text;
  for (const item of PERSON_FORMS) {
    next = replacePhrase(next, item.feminine, item.masculine);
  }
  return next;
}

export function resolveRelationType(
  tipo: string,
  personVoice: GrammaticalVoice | null,
): string {
  const pair = RELATION_TYPE_PAIRS[tipo];
  if (!pair || !personVoice || personVoice === 'neutral') return tipo;
  return pair[personVoice];
}

export function relationBondWord(tipo: string): 'amizade' | 'relação' {
  return tipo === 'Amizade próxima' ? 'amizade' : 'relação';
}

export function relationMapResultText(params: {
  tipo: string;
  nome: string;
  papel: string;
  frequencia: string;
  userVoice: GrammaticalVoice;
}): { displayTipo: string; resultText: string; personVoice: GrammaticalVoice | null } {
  const personVoice = inferNameVoice(params.nome);
  const displayTipo = resolveRelationType(params.tipo, personVoice);
  const displayName = params.nome.trim() || 'essa pessoa';
  const frequencia = applyPersonGenderedCopy(
    applyGenderedCopy(params.frequencia, params.userVoice),
    personVoice,
  );
  const papel = applyGenderedCopy(params.papel, params.userVoice);
  return {
    displayTipo,
    personVoice,
    resultText: `${displayTipo} · ${displayName} · ${papel} · ${frequencia}`,
  };
}

export function relationMapInternalContext(params: {
  tipo: string;
  displayTipo: string;
  nome: string;
  idade: string;
  papel: string;
  frequencia: string;
  personVoice: GrammaticalVoice | null;
  userVoice: GrammaticalVoice;
}): string {
  const papel = applyGenderedCopy(params.papel, params.userVoice);
  const frequencia = applyPersonGenderedCopy(
    applyGenderedCopy(params.frequencia, params.userVoice),
    params.personVoice,
  );

  const genderRule =
    params.personVoice === 'masculine'
      ? `Gênero de ${params.nome}: masculino. Use ele/dele. Nunca use ela/dela para ${params.nome}.`
      : params.personVoice === 'feminine'
        ? `Gênero de ${params.nome}: feminino. Use ela/dela.`
        : `Gênero de ${params.nome}: não inferido pelo nome. Não assuma mãe nem pai.`;

  const relationLine =
    params.displayTipo === 'Pai'
      ? `${params.nome} é o pai da pessoa que está falando.`
      : params.displayTipo === 'Mãe'
        ? `${params.nome} é a mãe da pessoa que está falando.`
        : `Relação: ${params.displayTipo}.`;

  return [
    `A pessoa escolheu olhar a relação com ${params.nome}.`,
    relationLine,
    params.displayTipo !== params.tipo ? `Opção original: ${params.tipo}.` : '',
    genderRule,
    params.idade.trim() ? `Idade: ${params.idade.trim()}.` : '',
    `Papel: ${papel}.`,
    `Frequência: ${frequencia}.`,
  ]
    .filter(Boolean)
    .join('\n');
}
