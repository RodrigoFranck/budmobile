import { supabase } from "@/integrations/supabase/client";

const MAX_TITLE_WORDS = 4;
const MAX_TITLE_LENGTH = 36;

const PLACEHOLDER_TITLE_PATTERNS = [
  /^conversa\s*#?\d+$/i,
  /^conversa\s+de\s+/i,
  /^nova conversa$/i,
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

function pickQualifier(messages: string[], excludedThemeLabels: string[]): string | null {
  const excluded = getExcludedTokens(excludedThemeLabels);
  const ranked = rankSubstantiveWords(messages, excluded);
  const top = ranked[0];
  if (!top) {
    return null;
  }
  return toQualifierLabel(top);
}

function combineTitleParts(parts: string[]): string | null {
  const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }

  if (unique.length === 1) {
    return capitalizeFirst(fitTitleLength(unique[0]));
  }

  const combined = unique.slice(0, 2).join(" e ");
  return capitalizeFirst(fitTitleLength(combined));
}

function extractExplicitTopic(messages: string[]): string | null {
  const combined = messages.join(" ");
  const sobreMatch = combined.match(
    /\b(?:sobre|falar\s+sobre|relacionad[oa]\s+a?|assunto\s+é)\s+([a-zà-ú]{3,20})/i,
  );
  if (sobreMatch?.[1] && !TITLE_STOP_WORDS.has(normalizeToken(sobreMatch[1]))) {
    return toQualifierLabel(normalizeToken(sobreMatch[1]));
  }
  return null;
}

function buildContextualTitle(messages: string[]): string | null {
  const rankedThemes = rankThemes(messages);
  const primary = rankedThemes[0];
  const secondary = rankedThemes[1];

  if (!primary) {
    const words = rankSubstantiveWords(messages, new Set());
    if (words.length >= 2) {
      return combineTitleParts([toQualifierLabel(words[0]), toQualifierLabel(words[1])]);
    }
    if (words.length === 1) {
      return combineTitleParts([toQualifierLabel(words[0])]);
    }
    const explicit = extractExplicitTopic(messages);
    return explicit ? combineTitleParts([explicit]) : null;
  }

  const subtype = detectThemeSubtype(messages, primary.label);
  const explicit = extractExplicitTopic(messages);
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
    return combineTitleParts([subtype, explicit ?? undefined].filter(Boolean) as string[]);
  }

  if (qualifier) {
    return combineTitleParts([primary.label, qualifier]);
  }

  if (secondary && secondary.score >= primary.score * 0.45) {
    return combineTitleParts([primary.label, secondary.label]);
  }

  if (explicit) {
    return combineTitleParts([primary.label, explicit]);
  }

  const words = rankSubstantiveWords(messages, getExcludedTokens([primary.label]));
  if (words.length > 0) {
    return combineTitleParts([primary.label, toQualifierLabel(words[0])]);
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
  ];
  return fragmentStarts.some((start) => lower.startsWith(start));
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
    try {
      const { data, error } = await supabase.functions.invoke("generate-conversation-title", {
        body: { conversationId },
      });

      if (!error && data?.title && !needsConversationTitleRegeneration(data.title)) {
        return data.title;
      }
    } catch {
      console.log("Edge Function not available, using local title generation");
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(12);

    if (messagesError || !messages || messages.length === 0) {
      console.error("Error fetching messages for title generation:", messagesError);
      return null;
    }

    const userMessagesNewestFirst = messages.map((message) => message.content);
    return buildTitleFromUserMessages(userMessagesNewestFirst);
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return null;
  }
}

const titleUpdateInFlight = new Set<string>();

export async function updateConversationTitleIfNeeded(conversationId: string): Promise<void> {
  if (titleUpdateInFlight.has(conversationId)) {
    return;
  }

  titleUpdateInFlight.add(conversationId);

  try {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", conversationId)
      .single();

    if (convError) {
      console.error("Error checking conversation title:", convError);
      return;
    }

    const title = await generateConversationTitle(conversationId);

    if (!title) {
      return;
    }

    const storedTitle = conversation?.title?.trim();
    const shouldUpdate =
      !storedTitle ||
      needsConversationTitleRegeneration(storedTitle) ||
      storedTitle !== title;

    if (!shouldUpdate) {
      return;
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Error updating conversation title:", updateError);
    }
  } catch (error) {
    console.error("Error in updateConversationTitleIfNeeded:", error);
  } finally {
    titleUpdateInFlight.delete(conversationId);
  }
}
