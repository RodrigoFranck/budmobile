import type { InternalProfile } from '@/hooks/useInternalProfile';

export type EmotionalIntensity = 'low' | 'medium' | 'high' | 'crisis';
export type UserIntent =
  | 'venting'
  | 'advice'
  | 'boundary_test'
  | 'play'
  | 'hostility'
  | 'exploration';

export type ResponseStrategy =
  | 'safety_protocol'
  | 'deep_validation'
  | 'relational_naming'
  | 'multiple_hypotheses'
  | 'body_exploration'
  | 'return_to_feeling'
  | 'balanced_exploration';

export interface MessageClassification {
  intensity: EmotionalIntensity;
  intent: UserIntent;
  motors: string[];
}

export interface ApproachDecision {
  strategy: ResponseStrategy;
  classification: MessageClassification;
  guidanceText: string;
}

const CRISIS_PATTERN =
  /suicid|me matar|quero morrer|autoles[aã]o|me cortar|n[aã]o quero viver|acabar com tudo|n[aã]o aguento mais viver/i;

const HIGH_INTENSITY_PATTERN =
  /odeio|desespero|n[aã]o aguento mais|socorro|!!+|[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{8,}/;

const VENTING_PATTERN =
  /cansad|exaust|pesad|difícil|dificil|n[aã]o sei mais|chega|saturad|esgotad/i;

const ADVICE_PATTERN =
  /o que (eu )?fa[çc]o|me (ajuda|diz|fala)|deveria|como (eu )?(resolv|lidar|super)|qual a solu[çc][aã]o/i;

const BOUNDARY_PATTERN =
  /responda s[oó]|s[oó] uma palavra|me testa|adivinha|repete|faz de conta/i;

const PLAY_PATTERN =
  /kkk|haha|brinc|jogo|se voc[eê] fosse|e se|adivinha/i;

const HOSTILITY_PATTERN =
  /in[uú]til|burr|idiota|voc[eê] n[aã]o (entende|serve|presta)|chatgpt|rob[oô]/i;

const RATIONALIZATION_PATTERN =
  /tecnicamente|objetivamente|na verdade o problema [eé]|analisando|logicamente/i;

const SOMATIZATION_PATTERN =
  /dor|tens[aã]o|corpo|peito apert|falta de ar|ins[oô]nia|n[aã]o durmo|cabeça doe/i;

const AVOIDANCE_PATTERN =
  /mudando de assunto|falando de outra coisa|deixa pra l[aá]|n[aã]o quero falar/i;

const STRATEGY_LABELS: Record<ResponseStrategy, string> = {
  safety_protocol: 'PROTOCOLO DE SEGURANÇA',
  deep_validation: 'VALIDAÇÃO PROFUNDA',
  relational_naming: 'NOMEAÇÃO DE PADRÃO RELACIONAL',
  multiple_hypotheses: 'MÚLTIPLAS HIPÓTESES',
  body_exploration: 'EXPLORAÇÃO SOMÁTICA',
  return_to_feeling: 'RETORNO AO SENTIR',
  balanced_exploration: 'EXPLORAÇÃO EQUILIBRADA',
};

export function classifyMessage(text: string): MessageClassification {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const motors: string[] = [];

  if (/abandon|rejei|sozinh|ningu[eé]m (fica|me quer)/i.test(lower)) {
    motors.push('insegurança de apego');
  }
  if (/preciso|devo|tenho que|obriga|controle/i.test(lower)) {
    motors.push('autonomia vs controle');
  }
  if (/prop[oó]sito|sentido|valores|n[aã]o [eé] isso/i.test(lower)) {
    motors.push('desalinhamento de valores');
  }
  if (/luto|perdi|termin|faleceu|saudade/i.test(lower)) {
    motors.push('perda não processada');
  }
  if (/burnout|esgot|sobrecarreg|n[aã]o paro/i.test(lower)) {
    motors.push('sobrecarga crônica');
  }
  if (/quem sou|n[aã]o sei quem|identidade/i.test(lower)) {
    motors.push('instabilidade identitária');
  }
  if (/incert|futuro|e se|n[aã]o sei o que vai/i.test(lower)) {
    motors.push('medo de incerteza');
  }

  let intensity: EmotionalIntensity = 'low';
  if (CRISIS_PATTERN.test(lower)) {
    intensity = 'crisis';
  } else if (HIGH_INTENSITY_PATTERN.test(normalized) || HOSTILITY_PATTERN.test(lower)) {
    intensity = 'high';
  } else if (VENTING_PATTERN.test(lower)) {
    intensity = 'medium';
  }

  let intent: UserIntent = 'exploration';
  if (CRISIS_PATTERN.test(lower)) {
    intent = 'venting';
  } else if (BOUNDARY_PATTERN.test(lower)) {
    intent = 'boundary_test';
  } else if (PLAY_PATTERN.test(lower) && intensity !== 'high') {
    intent = 'play';
  } else if (HOSTILITY_PATTERN.test(lower)) {
    intent = 'hostility';
  } else if (ADVICE_PATTERN.test(lower)) {
    intent = 'advice';
  } else if (VENTING_PATTERN.test(lower)) {
    intent = 'venting';
  }

  return { intensity, intent, motors };
}

function pickStrategy(
  classification: MessageClassification,
  profile: InternalProfile | null,
  turnCount: number,
): ResponseStrategy {
  const { intensity, intent } = classification;
  const style = profile?.communication_style;

  if (intensity === 'crisis') return 'safety_protocol';
  if (intensity === 'high' || intent === 'venting') return 'deep_validation';
  if (intent === 'boundary_test' || intent === 'play' || intent === 'hostility') {
    return 'relational_naming';
  }

  if (style?.needs_validation && (intensity === 'medium' || intent === 'venting')) {
    return 'deep_validation';
  }

  if (intent === 'exploration' && turnCount >= 4 && (intensity === 'low' || intensity === 'medium')) {
    return 'multiple_hypotheses';
  }

  return 'balanced_exploration';
}

function refineStrategyWithMessage(
  strategy: ResponseStrategy,
  message: string,
  classification: MessageClassification,
): ResponseStrategy {
  const lower = message.toLowerCase();

  if (classification.intensity === 'crisis') return 'safety_protocol';
  if (RATIONALIZATION_PATTERN.test(lower)) return 'return_to_feeling';
  if (SOMATIZATION_PATTERN.test(lower)) return 'body_exploration';
  if (AVOIDANCE_PATTERN.test(lower)) return 'relational_naming';

  return strategy;
}

function strategyFromProfile(
  strategy: ResponseStrategy,
  profile: InternalProfile | null,
): ResponseStrategy {
  if (!profile?.effective_approaches.length) return strategy;

  const approachMap: Record<string, ResponseStrategy> = {
    validação: 'deep_validation',
    validacao: 'deep_validation',
    perguntas: 'balanced_exploration',
    afirmações: 'balanced_exploration',
    afirmacoes: 'balanced_exploration',
    hipóteses: 'multiple_hypotheses',
    hipoteses: 'multiple_hypotheses',
    corpo: 'body_exploration',
    somático: 'body_exploration',
    somatico: 'body_exploration',
    nomear: 'relational_naming',
  };

  for (const item of profile.effective_approaches) {
    const key = item.approach.toLowerCase();
    for (const [needle, mapped] of Object.entries(approachMap)) {
      if (key.includes(needle)) return mapped;
    }
  }

  return strategy;
}

function buildGuidanceLines(
  strategy: ResponseStrategy,
  classification: MessageClassification,
  profile: InternalProfile | null,
): string[] {
  const lines = [
    '--- ESTRATÉGIA DESTA RESPOSTA (prioridade quando compatível com segurança) ---',
    `Classificação interna: intensidade=${classification.intensity}, intenção=${classification.intent}${
      classification.motors.length ? `, motores=${classification.motors.join(', ')}` : ''
    }`,
    `Estratégia escolhida: ${STRATEGY_LABELS[strategy]}`,
  ];

  switch (strategy) {
    case 'safety_protocol':
      lines.push('- Pare o aprofundamento emocional e foque em segurança imediata');
      lines.push('- Frases curtas; valide antes de qualquer exploração');
      break;
    case 'deep_validation':
      lines.push('- Valide profundamente primeiro (1-2 frases), sem apressar para resolução');
      lines.push('- Mais afirmações que perguntas neste turno');
      break;
    case 'relational_naming':
      lines.push('- Nomeie o padrão relacional ou de forma com curiosidade, sem acusar');
      lines.push('- Ofereça meta-escolha se houver resistência');
      break;
    case 'multiple_hypotheses':
      lines.push('- Use estrutura: espelhar + 2-4 hipóteses + pergunta focada');
      lines.push('- Linguagem de possibilidade: "pode ser", "talvez"');
      break;
    case 'body_exploration':
      lines.push('- Inclua exploração somática: "onde você sente isso no corpo?"');
      break;
    case 'return_to_feeling':
      lines.push('- Traga de volta ao sentir: "você explicou bem, mas o que você SENTE?"');
      break;
    default:
      lines.push('- Balance validação e exploração; uma ideia por mensagem');
      break;
  }

  const style = profile?.communication_style;
  if (style?.prefers_questions === true) {
    lines.push('- Este usuário responde melhor a perguntas diretas');
  } else if (style?.prefers_questions === false) {
    lines.push('- Este usuário responde melhor a afirmações e observações reflexivas');
  }

  if (profile?.effective_approaches.length) {
    const top = profile.effective_approaches
      .slice(0, 3)
      .map((item) => item.approach)
      .join('; ');
    lines.push(`- Abordagens que já funcionaram: ${top}`);
  }

  lines.push('--- FIM DA ESTRATÉGIA ---');
  return lines;
}

export function matchApproach(
  message: string,
  profile: InternalProfile | null,
  turnCount = 1,
): ApproachDecision {
  const classification = classifyMessage(message);
  let strategy = pickStrategy(classification, profile, turnCount);
  strategy = refineStrategyWithMessage(strategy, message, classification);
  strategy = strategyFromProfile(strategy, profile);

  return {
    strategy,
    classification,
    guidanceText: buildGuidanceLines(strategy, classification, profile).join('\n'),
  };
}

export function countUserTurns(messages: Array<{ role: string; content: string }>): number {
  return messages.filter((message) => message.role === 'user').length;
}
