export type GrammaticalVoice = 'feminine' | 'masculine' | 'neutral';

/** Product labels from onb_07_genero / user.genero. */
export type GrammaticalGender = 'feminino' | 'masculino' | 'neutro';

type GenderedForm = {
  feminine: string;
  masculine: string;
  neutral: string;
};

function form(feminine: string, masculine: string, neutral = `${masculine}(a)`): GenderedForm {
  return { feminine, masculine, neutral };
}

/**
 * Neutral chip/state words avoid marked o/a (TF-73).
 * Sentence-level neutrals keep a readable inclusive form when a rewrite would break grammar.
 */
const FORMS: GenderedForm[] = [
  form(
    'nervosa, ansiosa ou muito tensa',
    'nervoso, ansioso ou muito tenso',
    'com nervosismo, ansiedade ou muita tensão',
  ),
  form(
    'ansiosa ou deprimida',
    'ansioso ou deprimido',
    'com ansiedade ou depressão',
  ),
  form('ansiosa ou nervosa', 'ansioso ou nervoso', 'com ansiedade ou nervosismo'),
  form('Sim, sou espiritualizada', 'Sim, sou espiritualizado', 'Sim, tenho espiritualidade'),
  form('Mais parecida comigo', 'Mais parecido comigo', 'Mais parecida ou parecido comigo'),
  form('Orgulhosa do caminho', 'Orgulhoso do caminho', 'Orgulho do caminho'),
  form('Tempo sozinha', 'Tempo sozinho', 'Tempo a sós'),
  form('Você não está sozinha', 'Você não está sozinho', 'Você não está só'),
  form('facilmente irritada', 'facilmente irritado', 'facilmente irritável'),
  form('ficar parada', 'ficar parado', 'ficar parada ou parado'),
  form('Estou pronta', 'Estou pronto', 'Estou pronta ou pronto'),
  form('Mais calma', 'Mais calmo', 'Com mais calma'),
  form('ser cuidada', 'ser cuidado', 'receber cuidado'),
  form('está sozinha', 'está sozinho', 'está só'),
  form('incomodada', 'incomodado', 'com incômodo'),
  form('deprimida', 'deprimido', 'com depressão'),
  form('internada', 'internado', 'internada ou internado'),
  form('chamada', 'chamado', 'chamada ou chamado'),
  form('honesta', 'honesto', 'honesta ou honesto'),
  form('Cansada', 'Cansado', 'Com cansaço'),
  form('Energizada', 'Energizado', 'Com energia'),
  form('Relaxada', 'Relaxado', 'Em relaxamento'),
  form('Descansada', 'Descansado', 'Em descanso'),
  form('Bloqueada', 'Bloqueado', 'Com bloqueio'),
  form('Esperançosa', 'Esperançoso', 'Com esperança'),
  form('Solitária', 'Solitário', 'Em solidão'),
  form('Apoiada', 'Apoiado', 'Com apoio'),
  form('Valorizada', 'Valorizado', 'Com valorização'),
  form('Curiosa', 'Curioso', 'Com curiosidade'),
  form('Afiada', 'Afiado', 'Com clareza'),
  form('Inspirada', 'Inspirado', 'Com inspiração'),
  form('Criativa', 'Criativo', 'Com criatividade'),
  form('Grata', 'Grato', 'Com gratidão'),
  form('Calma', 'Calmo', 'Em calma'),
  form('Tranquila', 'Tranquilo', 'Em tranquilidade'),
  form('Ansiosa', 'Ansioso', 'Com ansiedade'),
  form('Irritada', 'Irritado', 'Com irritação'),
  form('Confusa', 'Confuso', 'Com confusão'),
  form('Desanimada', 'Desanimado', 'Com desânimo'),
  form('Motivada', 'Motivado', 'Com motivação'),
  form('Nervosa', 'Nervoso', 'Com nervosismo'),
  form('Compreensiva', 'Compreensivo', 'Com compreensão'),
  form('Dolorida', 'Dolorido', 'Com dor'),
  form('Satisfeita', 'Satisfeito', 'Com satisfação'),
  form('Anestesiada', 'Anestesiado', 'Sem sentir'),
  form('Preocupada', 'Preocupado', 'Com preocupação'),
  form('Conectada', 'Conectado', 'Em conexão'),
  form('Esgotada', 'Esgotado', 'Sem energia'),
  form('Sozinha', 'Sozinho', 'Sem companhia'),
  form('Isolada', 'Isolado', 'Em isolamento'),
  form('Retraída', 'Retraído', 'Em retraimento'),
  form('Ligada', 'Ligado', 'Em ligação'),
  form('Apática', 'Apático', 'Com apatia'),
  form('Inquieta', 'Inquieto', 'Com inquietação'),
  form('Pesada', 'Pesado', 'Com peso'),
  form('Tensa', 'Tenso', 'Com tensão'),
  form('Lenta', 'Lento', 'Em ritmo lento'),
  form('Crítica', 'Crítico', 'Em crítica'),
  form('Justa', 'Justo', 'Com justiça'),
  form('Dura', 'Duro', 'Com dureza'),
  form('você mesma', 'você mesmo', 'você mesma ou mesmo'),
  form('eu mesma', 'eu mesmo', 'eu mesma ou mesmo'),
  form('Ser vista, escolhida', 'Ser visto, escolhido', 'Ser vista ou visto, escolhida ou escolhido'),
  form('Continuar curiosa', 'Continuar curioso', 'Continuar com curiosidade'),
  form('sobrecarregada', 'sobrecarregado', 'com sobrecarga'),
  form('divertidos juntas', 'divertidos juntos', 'divertidos em conjunto'),
  form('Somos parceiras', 'Somos parceiros', 'Somos parceiras ou parceiros'),
  form('Determinada', 'Determinado', 'Com determinação'),
  form('Distraída', 'Distraído', 'Com distração'),
  form('Frustrada', 'Frustrado', 'Com frustração'),
  form('Acelerada', 'Acelerado', 'Em aceleração'),
  form('Nublada', 'Nublado', 'Com névoa mental'),
  form('Dispersa', 'Disperso', 'Com dispersão'),
  form('Focada', 'Focado', 'Com foco'),
  form('Quieta', 'Quieto', 'Em quietude'),
  form('Cheia', 'Cheio', 'No limite'),
  form('Desconfortável', 'Desconfortável'),
  form('Confortável', 'Confortável'),
  form('Travada', 'Travado', 'Com trava'),
  form('Clara', 'Claro', 'Com clareza'),
  form('Envolvida', 'Envolvido', 'Com envolvimento'),
  form('Confiante', 'Confiante'),
  form('Animada', 'Animado', 'Com ânimo'),
  form('Estável', 'Estável'),
  form('Incompreendida', 'Incompreendido', 'Sem compreensão'),
  form('Vista', 'Visto', 'Com reconhecimento'),
  form('Sobrecarregada', 'Sobrecarregado', 'Com sobrecarga'),
  form('Alegre', 'Alegre'),
  form('Forte', 'Forte'),
  form('Alerta', 'Alerta'),
  form('Triste', 'Triste'),
  form('Distante', 'Distante'),
  form('Presente', 'Presente'),
].sort((a, b) => {
  const len = (item: GenderedForm) =>
    Math.max(item.feminine.length, item.masculine.length, item.neutral.length);
  return len(b) - len(a);
});

export function genderVoiceFrom(value: string | null | undefined): GrammaticalVoice {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'mulher' || normalized === 'feminino' || normalized === 'female') {
    return 'feminine';
  }
  if (normalized === 'homem' || normalized === 'masculino' || normalized === 'male') {
    return 'masculine';
  }
  return 'neutral';
}

export function grammaticalGenderFrom(value: string | null | undefined): GrammaticalGender {
  const voice = genderVoiceFrom(value);
  if (voice === 'feminine') return 'feminino';
  if (voice === 'masculine') return 'masculino';
  return 'neutro';
}

export function genderAddressInstruction(
  value: string | null | undefined | GrammaticalVoice,
): string {
  const voice =
    value === 'feminine' || value === 'masculine' || value === 'neutral'
      ? value
      : genderVoiceFrom(value);
  if (voice === 'feminine') {
    return 'Refira-se à pessoa no feminino.';
  }
  if (voice === 'masculine') {
    return 'Refira-se à pessoa no masculino.';
  }
  return 'Refira-se à pessoa sem marcar gênero (neutro: sem o/a marcado; prefira formas sem flexão).';
}

function adaptCase(matched: string, target: string) {
  if (!matched || !target) return target;
  if (matched[0] === matched[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target.charAt(0).toLowerCase() + target.slice(1);
}

function isLetter(ch: string | undefined) {
  return Boolean(ch && /[A-Za-zÀ-ÿ]/.test(ch));
}

function replaceAllInsensitive(text: string, source: string, target: string) {
  const needle = source.toLowerCase();
  const lower = text.toLowerCase();
  const hits: number[] = [];
  let from = 0;
  while (from <= lower.length - needle.length) {
    const index = lower.indexOf(needle, from);
    if (index < 0) break;
    const afterIndex = index + source.length;
    if (isLetter(index > 0 ? text[index - 1] : undefined) || isLetter(text[afterIndex])) {
      from = index + needle.length;
      continue;
    }
    if (text.slice(afterIndex, afterIndex + 3) === '(a)') {
      from = afterIndex;
      continue;
    }
    hits.push(index);
    from = afterIndex;
  }
  let next = text;
  for (let i = hits.length - 1; i >= 0; i -= 1) {
    const index = hits[i];
    const matched = next.slice(index, index + source.length);
    const adapted = adaptCase(matched, target);
    next = `${next.slice(0, index)}${adapted}${next.slice(index + source.length)}`;
  }
  return next;
}

export function applyGenderedCopy(text: string, voice: GrammaticalVoice): string {
  let next = text;
  for (const item of FORMS) {
    const target = item[voice];
    const sources = [item.feminine, item.masculine, item.neutral]
      .filter((value, index, all) => value !== target && all.indexOf(value) === index)
      .sort((a, b) => b.length - a.length);
    for (const source of sources) {
      const updated = replaceAllInsensitive(next, source, target);
      if (updated !== next) {
        next = updated;
        break;
      }
    }
  }
  return next;
}

/**
 * Lint for generated text referred to the person: wrong-gender adjectives/participles fail.
 * Correction rewrites via the gendered dictionary (regenerate caller may retry first).
 */
export function lintGeneratedGender(
  text: string,
  voice: GrammaticalVoice,
): { ok: boolean; corrected: string } {
  const corrected = applyGenderedCopy(text, voice);
  return { ok: corrected === text, corrected };
}

export function enforceGeneratedGender(
  text: string,
  voice: GrammaticalVoice,
): string {
  return lintGeneratedGender(text, voice).corrected;
}

export function genderDeepStrings<T>(value: T, voice: GrammaticalVoice): T {
  if (typeof value === 'string') {
    return applyGenderedCopy(value, voice) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => genderDeepStrings(item, voice)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = genderDeepStrings(nested, voice);
    }
    return out as T;
  }
  return value;
}

export function optionsMatch(a: string, b: string) {
  if (a === b) return true;
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return true;
  return FORMS.some((item) => {
    const values = [item.feminine, item.masculine, item.neutral].map((value) => value.toLowerCase());
    return values.includes(left) && values.includes(right);
  });
}

export function displayedOptionsFrom(
  stored: string[],
  options: readonly string[] | undefined,
) {
  if (!options?.length) return stored;
  return options.filter((option) => stored.some((item) => optionsMatch(item, option)));
}
