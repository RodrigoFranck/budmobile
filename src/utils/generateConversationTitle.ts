import { supabase } from "@/integrations/supabase/client";

const MAX_TITLE_WORDS = 4;
const MAX_TITLE_LENGTH = 36;

const PLACEHOLDER_TITLE_PATTERNS = [
  /^conversa\s*#?\d+$/i,
  /^conversa\s+de\s+/i,
  /^nova conversa$/i,
  /^conversa do dia$/i,
  /^chat\s*#?\d+$/i,
  /^new chat$/i,
  /^untitled$/i,
];

const FILLER_MESSAGE_PATTERN =
  /^(oi|olá|ola|hey|e aí|eai|bom dia|boa tarde|boa noite|quero conversar|preciso conversar|vamos conversar|tudo bem|td bem|check|ok|sim|não|nao|obrigad[oa]|valeu|entendi|certo|beleza|tchau|até mais|ate mais|flw)[\s!.,?]*$/i;

const CONVERSATION_THEMES: Array<{ label: string; keywords: string[] }> = [
  { label: "Sono", keywords: ["sono", "dormir", "dormi", "dormindo", "insônia", "insonia", "acordar", "acordei", "cansado", "cansada", "descanso", "noite", "pesadelo", "cama"] },
  { label: "Ansiedade", keywords: ["ansiedade", "ansioso", "ansiosa", "nervoso", "nervosa", "preocupado", "preocupada", "preocupação", "preocupacao", "angústia", "angustia", "pânico", "panico"] },
  { label: "Trabalho", keywords: ["trabalho", "trabalhar", "emprego", "chefe", "escritório", "escritorio", "reunião", "reuniao", "burnout", "carreira", "pressão", "pressao"] },
  { label: "Humor", keywords: ["triste", "tristeza", "deprimido", "deprimida", "depressão", "depressao", "desanimado", "desanimada", "feliz", "alegria", "motivação", "motivacao", "vazio", "sozinho", "sozinha"] },
  { label: "Relacionamentos", keywords: ["relacionamento", "namoro", "parceiro", "parceira", "família", "familia", "mãe", "mae", "pai", "amigo", "amiga", "casamento", "separação", "separacao", "ciúmes", "ciumes"] },
  { label: "Saúde", keywords: ["saúde", "saude", "médico", "medico", "remédio", "remedio", "sintoma", "dor", "corpo", "exercício", "exercicio", "alimentação", "alimentacao"] },
  { label: "Rotina", keywords: ["rotina", "hábito", "habito", "hábitos", "habitos", "organizar", "produtividade", "foco", "procrastinar", "tempo"] },
  { label: "Autoestima", keywords: ["autoestima", "confiança", "confianca", "inseguro", "insegura", "culpa", "vergonha", "capaz", "fracasso"] },
  { label: "Estresse", keywords: ["estresse", "stress", "estressado", "estressada", "sobrecarga", "exausto", "exausta", "cobrança", "cobranca"] },
];

/** Subtemas mais específicos — ajudam a diferenciar conversas do mesmo tema */
const THEME_SUBTYPES: Record<string, Array<{ label: string; keywords: string[] }>> = {
  Sono: [
    { label: "Insônia", keywords: ["insônia", "insonia", "não durmo", "nao durmo", "demoro dormir"] },
    { label: "Pesadelos", keywords: ["pesadelo", "pesadelos", "sonho ruim"] },
    { label: "Cansaço", keywords: ["cansado", "cansada", "exausto", "exausta", "sem energia"] },
    { label: "Acordar cedo", keywords: ["acordei cedo", "acordar cedo", "cedo demais", "madrugada"] },
  ],
  Ansiedade: [
    { label: "Preocupação", keywords: ["preocupado", "preocupada", "preocupação", "preocupacao"] },
    { label: "Crise de pânico", keywords: ["pânico", "panico", "crise", "falta ar"] },
  ],
  Trabalho: [
    { label: "Burnout", keywords: ["burnout", "esgotado", "esgotada", "sobrecarga"] },
    { label: "Chefe", keywords: ["chefe", "gestor", "liderança", "lideranca"] },
  ],
  Humor: [
    { label: "Tristeza", keywords: ["triste", "tristeza", "chorar", "chorei"] },
    { label: "Desânimo", keywords: ["desanimado", "desanimada", "sem vontade", "vazio"] },
  ],
  Relacionamentos: [
    { label: "Família", keywords: ["família", "familia", "mãe", "mae", "pai", "filho", "filha", "irmão", "irmao", "irmã", "irma"] },
    { label: "Parceiro", keywords: ["parceiro", "parceira", "namorado", "namorada", "marido", "esposa", "namoro"] },
    { label: "Amizade", keywords: ["amigo", "amiga", "amizade"] },
  ],
  Saúde: [
    { label: "Sintomas", keywords: ["sintoma", "dor", "doendo", "machucado", "machucada", "febre"] },
    { label: "Exercício", keywords: ["exercício", "exercicio", "academia", "treino", "correr"] },
  ],
  Estresse: [
    { label: "Sobrecarga", keywords: ["sobrecarga", "exausto", "exausta", "demais", "cobrança", "cobranca"] },
    { label: "Pressão", keywords: ["pressão", "pressao", "prazo", "deadline", "urgente"] },
  ],
};

const BARE_THEME_LABELS = new Set(CONVERSATION_THEMES.map((theme) => theme.label));

const SPECIFIC_SUBTYPE_LABELS = new Set(
  Object.values(THEME_SUBTYPES).flatMap((subtypes) => subtypes.map((subtype) => subtype.label)),
);

const QUALIFIER_LABELS: Record<string, string> = {
  trabalho: "trabalho",
  emprego: "trabalho",
  chefe: "chefe",
  familia: "família",
  mae: "família",
  pai: "família",
  parceiro: "relacionamento",
  parceira: "relacionamento",
  namoro: "relacionamento",
  rotina: "rotina",
  estudo: "estudos",
  faculdade: "estudos",
  escola: "estudos",
  saude: "saúde",
  exercicio: "exercício",
  corpo: "corpo",
  dinheiro: "finanças",
  financeiro: "finanças",
  futuro: "futuro",
  passado: "passado",
  infancia: "infância",
  infância: "infância",
};

const TITLE_STOP_WORDS = new Set([
  "o", "a", "os", "as", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "para", "com", "por", "sem", "sobre", "entre", "que", "como", "quando",
  "eu", "você", "ele", "ela", "nós", "eles", "elas",
  "me", "te", "se", "nos", "lhe", "lhes",
  "meu", "minha", "seu", "sua", "é", "são", "está", "estou", "estar",
  "foi", "ser", "ter", "tem", "tinha", "hoje", "ontem", "agora", "mesmo", "ainda",
  "isso", "isto", "esse", "essa", "este", "esta", "aqui", "ali",
  "muito", "muita", "mais", "menos", "bem", "mal", "cedo", "tarde",
  "sim", "não", "nao", "ok", "quero", "preciso", "vamos", "conversar",
  "falar", "dizer", "acho", "sinto", "senti", "estava", "acordei", "acordar",
  "fiquei", "tenho", "tinha", "fazendo", "sendo", "coisa", "coisas", "vez",
  "sono", "dormir", "dormi", "dormindo",
  "gostaria", "consigo", "consegui", "conseguir", "precisava", "queria",
  "poderia", "devia", "seria", "estou", "estava", "estive", "sinto", "sentindo",
  "alguma", "algum", "algumas", "alguns", "tudo", "nada", "sempre", "nunca",
  "também", "tambem", "porque", "então", "entao", "assim", "daí", "dai",
  "outro", "outra", "outros", "outras", "mesmo", "mesma", "cada", "todo", "toda",
  "muito", "muita", "pouco", "pouca", "demais", "bastante", "quase", "talvez",
  "parece", "parecia", "acho", "penso", "pensando", "falando", "conversando",
  "voltar", "voltei", "retorno", "retornei", "prover", "providenciar",
  "realmente", "literalmente", "basicamente", "tipo",
  "gente", "voce", "você", "pedalar", "escutando", "brasil",
]);

const WEAK_QUALIFIER_WORDS = new Set([
  "alguma", "algum", "tudo", "nada", "coisa", "coisas", "gostaria", "consigo",
  "quero", "preciso", "estou", "estava", "sinto", "acho", "parece", "talvez",
  "sempre", "nunca", "ainda", "mesmo", "muito", "pouco", "bem", "mal",
  "retorno", "voltar", "prover", "falar", "conversar", "dizer", "pensar",
  "sentir", "fazer", "sendo", "tendo", "indo", "vindo", "ficando",
  "hoje", "ontem", "amanha", "amanhã", "agora", "depois", "antes",
  "realmente", "literalmente", "basicamente",
]);

interface ThemeScore {
  label: string;
  score: number;
}

function normalizeMessageText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeToken(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function tokenize(text: string): string[] {
  return normalizeToken(text)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function fitTitleLength(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) {
    return trimmed;
  }

  const words = trimmed.split(/\s+/);
  let result = words[0] ?? "";
  for (let i = 1; i < words.length; i += 1) {
    const next = `${result} e ${words[i]}`;
    if (next.length > MAX_TITLE_LENGTH) {
      break;
    }
    result = next;
  }

  return result.length <= MAX_TITLE_LENGTH ? result : result.slice(0, MAX_TITLE_LENGTH).trim();
}

function getThemeKeywords(themeLabel: string): string[] {
  const theme = CONVERSATION_THEMES.find((item) => item.label === themeLabel);
  return theme?.keywords ?? [];
}

function tokenMatchesKeyword(token: string, keyword: string): boolean {
  const normalizedToken = normalizeToken(token);
  const normalizedKeyword = normalizeToken(keyword);
  return (
    normalizedToken.includes(normalizedKeyword) ||
    normalizedKeyword.includes(normalizedToken)
  );
}

function scoreKeywordHits(messages: string[], keywords: string[]): number {
  let score = 0;

  messages.forEach((message, messageIndex) => {
    const tokens = tokenize(message);
    const weight = messages.length - messageIndex;

    keywords.forEach((keyword) => {
      if (tokens.some((token) => tokenMatchesKeyword(token, keyword))) {
        score += weight;
      }
    });
  });

  return score;
}

function rankThemes(messages: string[]): ThemeScore[] {
  return CONVERSATION_THEMES.map((theme) => ({
    label: theme.label,
    score: scoreKeywordHits(messages, theme.keywords),
  }))
    .filter((theme) => theme.score > 0)
    .sort((a, b) => b.score - a.score);
}

function detectThemeSubtype(messages: string[], themeLabel: string): string | null {
  const subtypes = THEME_SUBTYPES[themeLabel];
  if (!subtypes) {
    return null;
  }

  const ranked = subtypes
    .map((subtype) => ({
      label: subtype.label,
      score: scoreKeywordHits(messages, subtype.keywords),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.label ?? null;
}

function getExcludedTokens(themeLabels: string[]): Set<string> {
  const excluded = new Set<string>();
  themeLabels.forEach((label) => {
    getThemeKeywords(label).forEach((keyword) => excluded.add(normalizeToken(keyword)));
    const subtype = THEME_SUBTYPES[label];
    subtype?.forEach((item) => {
      item.keywords.forEach((keyword) => excluded.add(normalizeToken(keyword)));
    });
  });
  return excluded;
}

function rankSubstantiveWords(messages: string[], excludedTokens: Set<string>): string[] {
  const scores = new Map<string, number>();

  messages.forEach((message, messageIndex) => {
    const weight = messages.length - messageIndex;
    tokenize(message).forEach((word) => {
      if (TITLE_STOP_WORDS.has(word) || excludedTokens.has(word) || word.length < 4) {
        return;
      }
      const wordScore = (word.length >= 6 ? 2 : 1) * weight;
      scores.set(word, (scores.get(word) ?? 0) + wordScore);
    });
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function toQualifierLabel(word: string): string {
  return QUALIFIER_LABELS[word] ?? word;
}

function isWeakQualifier(word: string): boolean {
  const normalized = normalizeToken(word);
  if (!normalized || normalized.length < 4) {
    return true;
  }
  if (TITLE_STOP_WORDS.has(normalized) || WEAK_QUALIFIER_WORDS.has(normalized)) {
    return true;
  }
  return false;
}

function isGoodTitleCandidate(title: string): boolean {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  const substantiveWords = words.filter((word) => !isWeakQualifier(word));
  if (substantiveWords.length === 0) {
    return false;
  }
  if (words.length === 1) {
    const word = normalizeToken(words[0]);
    return word.length >= 5 || SPECIFIC_SUBTYPE_LABELS.has(words[0]);
  }
  return substantiveWords.length >= 1;
}

function cleanPhraseTokens(phrase: string): string | null {
  const words = tokenize(phrase)
    .filter((word) => !TITLE_STOP_WORDS.has(word) && !isWeakQualifier(word))
    .slice(0, 3)
    .map((word) => toQualifierLabel(word));

  if (words.length === 0) {
    return null;
  }

  return words.join(" ");
}

function stripLeadingFillers(text: string): string {
  return text
    .replace(/^(oi|olá|ola|hey|e aí|eai|bom dia|boa tarde|boa noite)[,!.?\s]*/i, "")
    .replace(/^(quero|preciso|gostaria)\s+(de\s+)?(falar|conversar)\s+(sobre\s+)?/i, "")
    .replace(/^(estou|tô|to)\s+(me\s+)?(sentindo|sinto)\s+/i, "")
    .replace(/^(tenho\s+)?(me\s+)?sentido\s+/i, "")
    .replace(/^(andei|estive)\s+(me\s+)?(sentindo|sinto)\s+/i, "")
    .trim();
}

function extractTopicFromPatterns(text: string): string | null {
  const patterns: Array<RegExp> = [
    /\b(?:falar|conversar)\s+sobre\s+(?:o\s+|a\s+|os\s+|as\s+|meu\s+|minha\s+|meus\s+|minhas\s+)?(.{3,40}?)(?:\.|,|!|\?|$)/i,
    /\bsobre\s+(?:o\s+|a\s+|os\s+|as\s+|meu\s+|minha\s+)?(.{3,40}?)(?:\.|,|!|\?|$)/i,
    /\b(?:preocupad[oa]|ansios[oa]|triste|estressad[oa]|desanimad[oa]|cansad[oa]|irritad[oa])\s+(?:com|por)\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.{3,35}?)(?:\.|,|e\s|$)/i,
    /\bproblema[s]?\s+com\s+(?:o\s+|a\s+|meu\s+|minha\s+)?(.{3,35}?)(?:\.|,|$)/i,
    /\bdificuldade\s+(?:de|para|em)\s+(.{3,35}?)(?:\.|,|$)/i,
    /\b(?:meu|minha)\s+(\w{4,15})\s+(?:está|esta|andou|tem sido|ficou)/i,
    /\bretorno\s+ao?\s+trabalho/i,
    /\bnão consigo\s+(\w{4,15})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }
    if (!match[1] && !/retorno/i.test(match[0])) {
      continue;
    }

    if (/retorno\s+ao?\s+trabalho/i.test(match[0])) {
      return "retorno ao trabalho";
    }

    const cleaned = cleanPhraseTokens(match[1] ?? "");
    if (cleaned && isGoodTitleCandidate(cleaned)) {
      return cleaned;
    }
  }

  return null;
}

function extractCoreFromMessage(message: string): string | null {
  const normalized = stripLeadingFillers(normalizeMessageText(message));
  if (!normalized) {
    return null;
  }

  const fromPattern = extractTopicFromPatterns(normalized);
  if (fromPattern) {
    return fromPattern;
  }

  const tokens = tokenize(normalized).filter(
    (word) => !TITLE_STOP_WORDS.has(word) && !isWeakQualifier(word),
  );

  if (tokens.length >= 2) {
    const phrase = tokens.slice(0, 3).map((word) => toQualifierLabel(word)).join(" ");
    if (isGoodTitleCandidate(phrase)) {
      return phrase;
    }
  }

  if (tokens.length === 1 && tokens[0].length >= 5) {
    return toQualifierLabel(tokens[0]);
  }

  return null;
}

function pickBestExtractedTitle(messages: string[]): string | null {
  let best: string | null = null;
  let bestScore = 0;

  for (const message of messages) {
    const extracted = extractCoreFromMessage(message);
    if (!extracted || !isGoodTitleCandidate(extracted)) {
      continue;
    }

    const wordCount = extracted.split(/\s+/).length;
    const score = wordCount * 10 + extracted.length;
    if (score > bestScore) {
      best = extracted;
      bestScore = score;
    }
  }

  return best;
}

function formatWithContext(head: string, context: string): string {
  const normalizedContext = normalizeToken(context);
  const peopleWords = [
    "mae", "mãe", "pai", "chefe", "parceiro", "parceira", "amigo", "amiga",
    "familia", "família", "namorado", "namorada", "marido", "esposa",
  ];

  if (peopleWords.some((person) => normalizedContext.includes(normalizeToken(person)))) {
    return `${head} com ${context}`;
  }

  const feminineWords = ["entrevista", "reuniao", "reunião", "escola", "faculdade", "crise"];
  if (
    feminineWords.some((word) => normalizedContext.includes(normalizeToken(word))) ||
    context.endsWith("a")
  ) {
    return `${head} na ${context}`;
  }

  return `${head} no ${context}`;
}

function smartCombine(head: string, tail: string): string {
  const normalizedHead = normalizeToken(head);
  const normalizedTail = normalizeToken(tail);

  if (!tail || isWeakQualifier(tail) || normalizedHead === normalizedTail) {
    return head;
  }

  if (BARE_THEME_LABELS.has(head) || SPECIFIC_SUBTYPE_LABELS.has(head)) {
    return formatWithContext(head, tail);
  }

  return `${head} e ${tail}`;
}

function combineTitleParts(parts: string[]): string | null {
  const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }

  if (unique.length === 1) {
    return capitalizeFirst(fitTitleLength(unique[0]));
  }

  const combined = smartCombine(unique[0], unique[1]);
  return capitalizeFirst(fitTitleLength(combined));
}

function pickQualifier(messages: string[], excludedThemeLabels: string[]): string | null {
  const excluded = getExcludedTokens(excludedThemeLabels);
  const ranked = rankSubstantiveWords(messages, excluded).filter((word) => !isWeakQualifier(word));
  const top = ranked[0];
  if (!top) {
    return null;
  }
  return toQualifierLabel(top);
}

function isBareThemeWord(word: string): boolean {
  const normalized = normalizeToken(word);
  return [...BARE_THEME_LABELS].some((label) => normalizeToken(label) === normalized);
}

function buildContextualTitle(messages: string[]): string | null {
  const extracted = pickBestExtractedTitle(messages);
  if (extracted) {
    const extractedWords = extracted.split(/\s+/).filter(Boolean);
    const isTooGeneric =
      extractedWords.length === 1 && isBareThemeWord(extractedWords[0]);

    if (!isTooGeneric) {
      return capitalizeFirst(fitTitleLength(extracted));
    }
  }

  const rankedThemes = rankThemes(messages);
  const primary = rankedThemes[0];
  const secondary = rankedThemes[1];

  if (!primary) {
    const words = rankSubstantiveWords(messages, new Set()).filter((word) => !isWeakQualifier(word));
    if (words.length >= 2) {
      return combineTitleParts([toQualifierLabel(words[0]), toQualifierLabel(words[1])]);
    }
    if (words.length === 1) {
      return combineTitleParts([toQualifierLabel(words[0])]);
    }
    return null;
  }

  const subtype = detectThemeSubtype(messages, primary.label);
  const qualifier = pickQualifier(messages, [
    primary.label,
    ...(subtype ? [subtype] : []),
    ...(secondary ? [secondary.label] : []),
  ]);

  if (subtype && qualifier) {
    return combineTitleParts([subtype, qualifier]);
  }

  if (subtype && secondary && secondary.label !== primary.label) {
    return combineTitleParts([subtype, secondary.label]);
  }

  if (subtype) {
    return combineTitleParts([subtype]);
  }

  if (qualifier && qualifier.length >= 5) {
    return combineTitleParts([primary.label, qualifier]);
  }

  if (secondary && secondary.score >= primary.score * 0.6) {
    return combineTitleParts([primary.label, secondary.label]);
  }

  const words = rankSubstantiveWords(messages, getExcludedTokens([primary.label]))
    .filter((word) => !isWeakQualifier(word) && word.length >= 5);
  if (words.length > 0) {
    return combineTitleParts([primary.label, toQualifierLabel(words[0])]);
  }

  if (SPECIFIC_SUBTYPE_LABELS.has(primary.label)) {
    return capitalizeFirst(primary.label);
  }

  return null;
}

function looksLikeSentenceFragment(title: string): boolean {
  const lower = title.toLowerCase();
  const fragmentStarts = [
    "acordei",
    "sinto",
    "estou",
    "tenho",
    "fiquei",
    "acho",
    "quero",
    "preciso",
    "vou",
    "não",
    "nao",
    "hoje",
    "ontem",
    "conversou",
    "posso",
    "compartilhar",
    "finalizar",
    "queee",
    "conversando",
    "falando",
  ];
  return fragmentStarts.some((start) => lower.startsWith(start));
}

function looksLikeAssistantEcho(title: string): boolean {
  const lower = title.toLowerCase();
  if (/^(voce|você|bud)\b/.test(lower)) {
    return true;
  }
  return /\b(descreveu|perfeitamente|testando|funcionalidades|tebe)\b/.test(lower);
}

function looksLikeExtractedFragment(title: string): boolean {
  const lower = title.toLowerCase();
  const badStarts = [
    "acha ",
    "tebe ",
    "verdade ",
    "conversou ",
    "queee ",
    "busca por ",
  ];
  return badStarts.some((start) => lower.startsWith(start));
}

function looksLikeLiteralExtraction(title: string): boolean {
  const lower = title.toLowerCase();
  if (/(.)\1{2,}/i.test(title)) {
    return true;
  }
  if (/^(cara|mano|tipo|nossa|ajude|quero|preciso|tive|senti|estou|estava)\b/.test(lower)) {
    return true;
  }
  if (/\b(tooo|porqueee|sucedido)\b/.test(lower)) {
    return true;
  }
  return false;
}

function hasWeakQualifierPattern(title: string): boolean {
  const match = title.match(/^(.+?)\s+e\s+(\S+)$/i);
  if (!match?.[1] || !match[2]) {
    return false;
  }

  const [, head, tail] = match;
  if (isWeakQualifier(tail)) {
    return true;
  }

  if (
    (BARE_THEME_LABELS.has(head) || SPECIFIC_SUBTYPE_LABELS.has(head)) &&
    tail.length < 5
  ) {
    return true;
  }

  return false;
}

export function isPlaceholderConversationTitle(title: string | null | undefined): boolean {
  const trimmed = title?.trim();
  if (!trimmed) {
    return true;
  }
  return PLACEHOLDER_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isLowQualityConversationTitle(title: string | null | undefined): boolean {
  const trimmed = title?.trim();
  if (!trimmed) {
    return true;
  }

  if (BARE_THEME_LABELS.has(trimmed)) {
    return true;
  }

  if (looksLikeSentenceFragment(trimmed)) {
    return true;
  }

  if (hasWeakQualifierPattern(trimmed)) {
    return true;
  }

  if (looksLikeAssistantEcho(trimmed)) {
    return true;
  }

  if (looksLikeExtractedFragment(trimmed)) {
    return true;
  }

  if (looksLikeLiteralExtraction(trimmed)) {
    return true;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 && !SPECIFIC_SUBTYPE_LABELS.has(trimmed)) {
    return true;
  }

  const lowerWords = words.map((word) => word.toLowerCase());
  const uniqueWords = new Set(lowerWords);
  if (uniqueWords.size < words.length) {
    return true;
  }

  return false;
}

export function needsConversationTitleRegeneration(title: string | null | undefined): boolean {
  const trimmed = title?.trim();
  if (!trimmed) {
    return true;
  }
  if (isPlaceholderConversationTitle(trimmed) || isLowQualityConversationTitle(trimmed)) {
    return true;
  }
  if (trimmed.endsWith("...")) {
    return true;
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return true;
  }
  if (trimmed.split(/\s+/).filter(Boolean).length > MAX_TITLE_WORDS) {
    return true;
  }
  return false;
}

export function pickUserMessageForTitle(userMessagesNewestFirst: string[]): string | null {
  for (const content of userMessagesNewestFirst) {
    const normalized = normalizeMessageText(content);
    if (!normalized || FILLER_MESSAGE_PATTERN.test(normalized)) {
      continue;
    }
    return content;
  }
  return null;
}

export function buildTitleFromUserMessages(userMessagesNewestFirst: string[]): string | null {
  const messages = userMessagesNewestFirst
    .map(normalizeMessageText)
    .filter((message) => message && !FILLER_MESSAGE_PATTERN.test(message));

  if (messages.length === 0) {
    return null;
  }

  return buildContextualTitle(messages);
}

export function buildTitleFromUserText(userText: string): string | null {
  const normalized = normalizeMessageText(userText);
  if (!normalized || FILLER_MESSAGE_PATTERN.test(normalized)) {
    return null;
  }
  return buildTitleFromUserMessages([normalized]);
}

export function resolveConversationDisplayTitle(
  storedTitle: string | null | undefined,
  fallback: string,
): string {
  if (storedTitle && !needsConversationTitleRegeneration(storedTitle)) {
    return storedTitle;
  }
  return fallback;
}

export async function generateConversationTitle(conversationId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-conversation-title", {
      body: { conversationId },
    });

    if (!error && data?.title && typeof data.title === "string") {
      const title = data.title.trim();
      if (title && !needsConversationTitleRegeneration(title)) {
        return title;
      }
    }

    if (error) {
      console.warn("AI title generation failed:", error.message);
    } else if (data?.error) {
      console.warn("AI title generation failed:", data.error);
    }
  } catch (invokeError) {
    console.warn("Edge Function not available for title generation:", invokeError);
  }

  return null;
}

const TITLE_SYNC_CONCURRENCY = 3;

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  );

  await Promise.all(workers);
  return results;
}

export async function prepareHistoryConversationTitles<
  T extends { id: string; title: string | null },
>(conversations: T[]): Promise<T[]> {
  if (conversations.length === 0) {
    return conversations;
  }

  return runWithConcurrency(conversations, TITLE_SYNC_CONCURRENCY, async (conversation) => {
    if (conversation.title && !needsConversationTitleRegeneration(conversation.title)) {
      return conversation;
    }

    const title = await updateConversationTitleIfNeeded(conversation.id);
    if (!title) {
      return conversation;
    }

    return { ...conversation, title };
  });
}

const titleUpdatePromises = new Map<string, Promise<string | null>>();

export async function updateConversationTitleIfNeeded(conversationId: string): Promise<string | null> {
  const inFlight = titleUpdatePromises.get(conversationId);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("title")
        .eq("id", conversationId)
        .single();

      if (convError) {
        console.error("Error checking conversation title:", convError);
        return null;
      }

      const title = await generateConversationTitle(conversationId);

      if (!title) {
        return null;
      }

      const storedTitle = conversation?.title?.trim();
      const shouldUpdate =
        !storedTitle ||
        needsConversationTitleRegeneration(storedTitle) ||
        storedTitle !== title;

      if (!shouldUpdate) {
        return storedTitle ?? title;
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId);

      if (updateError) {
        console.error("Error updating conversation title:", updateError);
        return title;
      }

      return title;
    } catch (error) {
      console.error("Error in updateConversationTitleIfNeeded:", error);
      return null;
    } finally {
      titleUpdatePromises.delete(conversationId);
    }
  })();

  titleUpdatePromises.set(conversationId, promise);
  return promise;
}
