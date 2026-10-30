import type { GrammaticalVoice } from '@/copy/genderedCopy';

const NAME_PARTICLES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'della', 'di']);

/** First names that would be misclassified by the -a / -o heuristic. */
const MASCULINE_NAMES = new Set([
  'abel',
  'abner',
  'abraao',
  'adao',
  'alexandre',
  'anderson',
  'andre',
  'anthony',
  'arthur',
  'benjamin',
  'bryan',
  'caique',
  'carlos',
  'christian',
  'cristian',
  'daniel',
  'davi',
  'david',
  'edson',
  'elias',
  'emerson',
  'enzo',
  'estevao',
  'felipe',
  'felix',
  'gabriel',
  'george',
  'guilherme',
  'heitor',
  'henrique',
  'ian',
  'igor',
  'inacio',
  'isaac',
  'isaias',
  'ismael',
  'israel',
  'ivan',
  'jaco',
  'james',
  'jefferson',
  'joao',
  'john',
  'jonathan',
  'jose',
  'joshua',
  'josias',
  'kaique',
  'kaua',
  'caua',
  'kaue',
  'kevin',
  'levi',
  'luca',
  'lucas',
  'luan',
  'luis',
  'luiz',
  'manuel',
  'marcos',
  'mateus',
  'matheus',
  'messias',
  'michael',
  'michel',
  'miguel',
  'moises',
  'nelson',
  'nicola',
  'nicolas',
  'noah',
  'noe',
  'oscar',
  'philipe',
  'philippe',
  'rafael',
  'raoni',
  'rui',
  'ruy',
  'ryan',
  'samuel',
  'saul',
  'simao',
  'tales',
  'thales',
  'theo',
  'thomas',
  'tomas',
  'tobias',
  'ulisses',
  'victor',
  'vinicius',
  'vitor',
  'wellington',
  'wesley',
  'william',
  'wilson',
  'yan',
  'yuri',
]);

const FEMININE_NAMES = new Set([
  'agnes',
  'alice',
  'aline',
  'andrea',
  'beatriz',
  'beatris',
  'catherine',
  'conceicao',
  'cris',
  'cristiane',
  'daniele',
  'danielle',
  'denise',
  'dolores',
  'elaine',
  'eliane',
  'ellen',
  'esther',
  'ester',
  'evelyn',
  'gabrielle',
  'helen',
  'iasmin',
  'ines',
  'ingrid',
  'irene',
  'iris',
  'isabel',
  'isabelle',
  'ivone',
  'jennifer',
  'joyce',
  'karen',
  'kelly',
  'lais',
  'lauren',
  'lilian',
  'lourdes',
  'luz',
  'mercedes',
  'michele',
  'michelle',
  'milene',
  'natalie',
  'nicole',
  'raquel',
  'rachel',
  'sheila',
  'simone',
  'solange',
  'tais',
  'thais',
  'viviane',
  'yasmin',
]);

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function firstGivenName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/[\s-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const given = parts.find((part) => !NAME_PARTICLES.has(stripDiacritics(part).toLowerCase()));
  return given ?? '';
}

export function inferNameVoice(name: string): GrammaticalVoice | null {
  const first = firstGivenName(name);
  if (!first) return null;

  const key = stripDiacritics(first).toLowerCase();
  if (MASCULINE_NAMES.has(key)) return 'masculine';
  if (FEMININE_NAMES.has(key)) return 'feminine';

  if (key.endsWith('a')) return 'feminine';
  if (key.endsWith('o')) return 'masculine';
  if (/(as|os|us|ons)$/.test(key)) return 'masculine';

  return null;
}
