export type GrammaticalVoice = 'feminine' | 'masculine' | 'neutral';

type GenderedForm = {
  feminine: string;
  masculine: string;
  neutral: string;
};

function form(feminine: string, masculine: string, neutral = `${masculine}(a)`): GenderedForm {
  return { feminine, masculine, neutral };
}

const FORMS: GenderedForm[] = [
  form(
    'nervosa, ansiosa ou muito tensa',
    'nervoso, ansioso ou muito tenso',
    'nervoso(a), ansioso(a) ou muito tenso(a)',
  ),
  form(
    'ansiosa ou deprimida',
    'ansioso ou deprimido',
    'ansioso(a) ou deprimido(a)',
  ),
  form('ansiosa ou nervosa', 'ansioso ou nervoso', 'ansioso(a) ou nervoso(a)'),
  form('Sim, sou espiritualizada', 'Sim, sou espiritualizado'),
  form('Mais parecida comigo', 'Mais parecido comigo'),
  form('Orgulhosa do caminho', 'Orgulhoso do caminho'),
  form('Tempo sozinha', 'Tempo sozinho'),
  form('Você não está sozinha', 'Você não está sozinho'),
  form('facilmente irritada', 'facilmente irritado'),
  form('ficar parada', 'ficar parado'),
  form('Estou pronta', 'Estou pronto'),
  form('Mais calma', 'Mais calmo'),
  form('ser cuidada', 'ser cuidado'),
  form('está sozinha', 'está sozinho'),
  form('incomodada', 'incomodado'),
  form('deprimida', 'deprimido'),
  form('internada', 'internado'),
  form('chamada', 'chamado'),
  form('honesta', 'honesto'),
  form('Cansada', 'Cansado'),
  form('Energizada', 'Energizado'),
  form('Relaxada', 'Relaxado'),
  form('Descansada', 'Descansado'),
  form('Bloqueada', 'Bloqueado'),
  form('Esperançosa', 'Esperançoso'),
  form('Solitária', 'Solitário'),
  form('Apoiada', 'Apoiado'),
  form('Valorizada', 'Valorizado'),
  form('Curiosa', 'Curioso'),
  form('Afiada', 'Afiado'),
  form('Inspirada', 'Inspirado'),
  form('Criativa', 'Criativo'),
  form('Grata', 'Grato'),
  form('Calma', 'Calmo'),
  form('Tranquila', 'Tranquilo'),
  form('Ansiosa', 'Ansioso'),
  form('Irritada', 'Irritado'),
  form('Confusa', 'Confuso'),
  form('Desanimada', 'Desanimado'),
  form('Motivada', 'Motivado'),
  form('Nervosa', 'Nervoso'),
  form('Compreensiva', 'Compreensivo'),
  form('Dolorida', 'Dolorido'),
  form('Satisfeita', 'Satisfeito'),
  form('Anestesiada', 'Anestesiado'),
  form('Preocupada', 'Preocupado'),
  form('Conectada', 'Conectado'),
  form('Esgotada', 'Esgotado'),
  form('Sozinha', 'Sozinho'),
  form('Isolada', 'Isolado'),
  form('Retraída', 'Retraído'),
  form('Ligada', 'Ligado'),
  form('Apática', 'Apático'),
  form('Inquieta', 'Inquieto'),
  form('Pesada', 'Pesado'),
  form('Tensa', 'Tenso'),
  form('Lenta', 'Lento'),
  form('Crítica', 'Crítico'),
  form('Justa', 'Justo'),
  form('Dura', 'Duro'),
  form('você mesma', 'você mesmo'),
  form('eu mesma', 'eu mesmo'),
  form('Ser vista, escolhida', 'Ser visto, escolhido'),
  form('Continuar curiosa', 'Continuar curioso'),
  form('sobrecarregada', 'sobrecarregado'),
  form('divertidos juntas', 'divertidos juntos', 'divertidos juntos(as)'),
  form('Somos parceiras', 'Somos parceiros'),
  form('Determinada', 'Determinado'),
  form('Distraída', 'Distraído'),
  form('Frustrada', 'Frustrado'),
  form('Acelerada', 'Acelerado'),
  form('Nublada', 'Nublado'),
  form('Dispersa', 'Disperso'),
  form('Focada', 'Focado'),
  form('Quieta', 'Quieto'),
  form('Cheia', 'Cheio'),
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
