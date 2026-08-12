import type { CheckinType } from '@/hooks/useCheckIns';
import type { CheckInChipOption, CheckInStepConfig } from './checkInFlow.types';

export function getOptionLabel(opt: CheckInChipOption): string {
  return typeof opt === 'string' ? opt : opt.label;
}

export function getOptionSubtitle(opt: CheckInChipOption): string | undefined {
  return typeof opt === 'string' ? undefined : opt.subtitle;
}

export const MORNING_CHECKIN_STEPS: CheckInStepConfig[] = [
  {
    key: 'energy',
    category: 'ENERGIA',
    question: 'Como você acordou hoje?',
    subtitle: 'Seu corpo, no agora.',
    inputType: 'slider',
    min: 1,
    max: 10,
    minLabel: 'Sem energia',
    maxLabel: 'Bem desperto',
    gradientColors: ['rgba(245,158,11,0.25)', 'rgba(244,63,94,0.12)', '#1D1916'],
  },
  {
    key: 'sleep_quality',
    category: 'SONO',
    question: 'Como foi sua noite?',
    inputType: 'chips',
    options: [
      { label: 'Reparador', subtitle: 'sono profundo' },
      { label: 'Razoável', subtitle: 'sono mediano' },
      { label: 'Agitado', subtitle: 'sono leve' },
      { label: 'Pouco', subtitle: 'dormi mal' },
      { label: 'Não dormi bem' },
    ],
    gradientColors: ['rgba(77,64,140,0.2)', 'rgba(89,77,128,0.12)', '#1D1916'],
  },
  {
    key: 'body_state',
    category: 'CORPO',
    question: 'Como está seu corpo?',
    inputType: 'chips',
    options: ['Tudo bem', 'Cansado', 'Dor leve', 'Dor forte', 'Tenso', 'Pesado', 'Leve'],
    gradientColors: ['rgba(20,184,166,0.2)', 'rgba(16,185,129,0.1)', '#1D1916'],
  },
  {
    key: 'mood',
    category: 'EMOÇÃO',
    question: 'E emocionalmente, como você acordou hoje?',
    inputType: 'chips',
    options: ['Tranquilo', 'Ansioso', 'Irritado', 'Confuso', 'Desanimado', 'Indiferente', 'Motivado'],
    gradientColors: ['rgba(236,72,153,0.2)', 'rgba(244,63,94,0.1)', '#1D1916'],
  },
  {
    key: 'mind_focus',
    category: 'MENTE',
    question: 'Como está sua cabeça hoje?',
    inputType: 'chips',
    options: ['Focada', 'Dispersa', 'Travada', 'Cheia', 'Quieta'],
    gradientColors: ['rgba(139,92,246,0.22)', 'rgba(168,85,247,0.1)', '#1D1916'],
  },
  {
    key: 'intention',
    category: 'INTENÇÃO',
    question: 'Uma palavra pro dia.',
    subtitle: 'O que você quer carregar?',
    inputType: 'text',
    textPlaceholder: 'Ex.: presença, leveza, foco...',
    gradientColors: ['rgba(234,179,8,0.18)', 'rgba(132,204,22,0.08)', '#1D1916'],
  },
];

export const POST_TRAINING_CHECKIN_STEPS: CheckInStepConfig[] = [
  {
    key: 'physical_effort',
    category: 'ESFORÇO',
    question: 'Quão pesado foi o treino?',
    inputType: 'slider',
    min: 1,
    max: 10,
    minLabel: 'Tranquilo',
    maxLabel: 'Limite',
    gradientColors: ['rgba(147,51,234,0.25)', 'rgba(59,130,246,0.12)', '#1D1916'],
  },
  {
    key: 'physical_state_after',
    category: 'CORPO PÓS',
    question: 'Como o seu corpo ficou depois do treino?',
    inputType: 'chips',
    options: ['Forte', 'Pesado', 'Cansado', 'Dolorido', 'Solto', 'Travado', 'Vazio'],
    gradientColors: ['rgba(37,99,235,0.2)', 'rgba(20,184,166,0.1)', '#1D1916'],
  },
  {
    key: 'mental_state',
    category: 'MENTE',
    question: 'Como estava sua cabeça durante o treino?',
    inputType: 'chips',
    options: ['Presente', 'Distraída', 'Determinada', 'Frustrada', 'Em dúvida', 'Acelerada'],
    gradientColors: ['rgba(99,102,241,0.22)', 'rgba(59,130,246,0.1)', '#1D1916'],
  },
  {
    key: 'emotional_state',
    category: 'EMOÇÃO',
    question: 'Que emoção predominou durante o treino?',
    inputType: 'chips',
    options: ['Alegria', 'Raiva', 'Ansiedade', 'Calma', 'Tristeza', 'Orgulho', 'Vergonha', 'Vazio'],
    gradientColors: ['rgba(225,29,72,0.2)', 'rgba(249,115,22,0.1)', '#1D1916'],
  },
  {
    key: 'technical_quality',
    category: 'TÉCNICA',
    question: 'Como foi tecnicamente?',
    inputType: 'slider',
    min: 1,
    max: 10,
    minLabel: 'Mal',
    maxLabel: 'Muito bem',
    gradientColors: ['rgba(16,185,129,0.2)', 'rgba(34,197,94,0.1)', '#1D1916'],
  },
  {
    key: 'self_judgment',
    category: 'JULGAMENTO',
    question: 'Como você se julgou?',
    subtitle: 'Honesto, sem filtro.',
    inputType: 'chips',
    options: ['Compreensivo', 'Crítico', 'Duro', 'Justo', 'Indiferente'],
    gradientColors: ['rgba(245,158,11,0.2)', 'rgba(234,179,8,0.1)', '#1D1916'],
  },
  {
    key: 'highlight',
    category: 'DESTAQUE',
    question: 'O que funcionou?',
    inputType: 'text',
    textPlaceholder: 'Pode ser pequeno...',
    optional: true,
    gradientColors: ['rgba(132,204,22,0.18)', 'rgba(16,185,129,0.08)', '#1D1916'],
  },
  {
    key: 'challenge',
    category: 'DESAFIO',
    question: 'O que travou?',
    inputType: 'text',
    textPlaceholder: 'Físico, mental, emocional...',
    optional: true,
    gradientColors: ['rgba(239,68,68,0.18)', 'rgba(244,63,94,0.08)', '#1D1916'],
  },
  {
    key: 'open_note',
    category: 'LIVRE',
    question: 'Algo mais pra dizer?',
    subtitle: 'Opcional. Solta o que vier.',
    inputType: 'text',
    textPlaceholder: '...',
    optional: true,
    gradientColors: ['rgba(100,116,139,0.2)', 'rgba(82,82,91,0.1)', '#1D1916'],
  },
];

export const POST_GAME_CHECKIN_STEPS: CheckInStepConfig[] = [
  {
    key: 'entry_state',
    category: 'ANTES',
    question: 'Como você entrou pro jogo?',
    inputType: 'chips',
    options: [
      'Tranquilo',
      'Confiante',
      'Ligado',
      'Nervoso',
      'Ansioso',
      'Na dúvida',
      'Indiferente',
    ],
    gradientColors: ['rgba(120,53,15,0.28)', 'rgba(180,83,9,0.12)', '#1D1916'],
  },
  {
    key: 'mental_state',
    category: 'MENTE',
    question: 'E a cabeça durante o jogo?',
    inputType: 'chips',
    options: ['Presente', 'Distraída', 'Determinada', 'Frustrada', 'Em dúvida', 'Acelerada'],
    gradientColors: ['rgba(99,102,241,0.22)', 'rgba(59,130,246,0.1)', '#1D1916'],
  },
  {
    key: 'emotional_state',
    category: 'EMOÇÃO',
    question: 'Que emoção predominou?',
    inputType: 'chips',
    options: [
      'Alegria',
      'Raiva',
      'Ansiedade',
      'Calma',
      'Tristeza',
      'Orgulho',
      'Vergonha',
      'Vazio',
    ],
    gradientColors: ['rgba(225,29,72,0.2)', 'rgba(249,115,22,0.1)', '#1D1916'],
  },
  {
    key: 'expectation_match',
    category: 'EXPECTATIVA',
    question: 'Você jogou como imaginava?',
    subtitle: 'O que você planejou vs. o que saiu.',
    inputType: 'slider',
    min: 1,
    max: 10,
    minLabel: 'Longe',
    maxLabel: 'Exatamente',
    gradientColors: ['rgba(146,64,14,0.25)', 'rgba(180,83,9,0.12)', '#1D1916'],
  },
  {
    key: 'self_judgment',
    category: 'JULGAMENTO',
    question: 'Como você se julgou?',
    inputType: 'chips',
    options: ['Compreensivo', 'Crítico', 'Duro', 'Justo', 'Indiferente'],
    gradientColors: ['rgba(245,158,11,0.2)', 'rgba(234,179,8,0.1)', '#1D1916'],
  },
  {
    key: 'open_note',
    category: 'LIVRE',
    question: 'O que fica desse jogo pra você?',
    subtitle: 'Um aprendizado, uma cena, o que vier.',
    inputType: 'text',
    textPlaceholder: '...',
    gradientColors: ['rgba(100,116,139,0.2)', 'rgba(82,82,91,0.1)', '#1D1916'],
  },
];

export function getCheckInSteps(type: CheckinType): CheckInStepConfig[] {
  if (type === 'morning') return MORNING_CHECKIN_STEPS;
  if (type === 'post_game') return POST_GAME_CHECKIN_STEPS;
  return POST_TRAINING_CHECKIN_STEPS;
}
