export const HEALTH_SURVEY_INSTRUMENT = 'health_survey';
export const UNKNOWN_ANSWER = 'Não sei';
export const HEALTH_SURVEY_QUESTION_COUNT = 22;
export const VAS_DEFAULT = 72;

export type SurveyChoiceInput = {
  type: 'choice';
  options: string[];
};

export type SurveyNumberInput = {
  type: 'number';
  placeholder: string;
  allowUnknown?: boolean;
};

export type SurveyVasInput = {
  type: 'vas';
  minLabel: string;
  maxLabel: string;
};

export type SurveyScaleInput = {
  type: 'scale';
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
};

export type SurveyInput = SurveyChoiceInput | SurveyNumberInput | SurveyVasInput | SurveyScaleInput;

export type HealthSurveyStep = {
  key: string;
  kicker?: string;
  title: string;
  input: SurveyInput;
  requiresWork?: boolean;
};

const QV_KICKER = 'Escolha a frase que melhor descreve a sua saúde HOJE.';
const MOOD_KICKER = 'Nas últimas 2 semanas, com que frequência você se sentiu incomodada por:';
const SERVICE_KICKER = 'Nos últimos 90 dias, quantas vezes você…';
const MOOD_OPTIONS = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias'];

export const HEALTH_SURVEY_STEPS: HealthSurveyStep[] = [
  {
    key: 'qv_mobility',
    kicker: QV_KICKER,
    title: 'Mobilidade',
    input: {
      type: 'choice',
      options: [
        'Não tenho problemas para andar',
        'Tenho problemas leves para andar',
        'Tenho problemas moderados para andar',
        'Tenho problemas graves para andar',
        'Sou incapaz de andar',
      ],
    },
  },
  {
    key: 'qv_selfcare',
    kicker: QV_KICKER,
    title: 'Cuidados pessoais',
    input: {
      type: 'choice',
      options: [
        'Não tenho problemas para me lavar ou me vestir',
        'Tenho problemas leves para me lavar ou me vestir',
        'Tenho problemas moderados para me lavar ou me vestir',
        'Tenho problemas graves para me lavar ou me vestir',
        'Sou incapaz de me lavar ou me vestir',
      ],
    },
  },
  {
    key: 'qv_activities',
    kicker: QV_KICKER,
    title: 'Atividades habituais (trabalho, estudos, tarefas de casa, família ou lazer)',
    input: {
      type: 'choice',
      options: [
        'Não tenho problemas',
        'Tenho problemas leves',
        'Tenho problemas moderados',
        'Tenho problemas graves',
        'Sou incapaz de fazer minhas atividades habituais',
      ],
    },
  },
  {
    key: 'qv_pain',
    kicker: QV_KICKER,
    title: 'Dor e desconforto',
    input: {
      type: 'choice',
      options: [
        'Não tenho dor ou desconforto',
        'Tenho dor ou desconforto leve',
        'Tenho dor ou desconforto moderado',
        'Tenho dor ou desconforto forte',
        'Tenho dor ou desconforto extremo',
      ],
    },
  },
  {
    key: 'qv_anxiety',
    kicker: QV_KICKER,
    title: 'Ansiedade e tristeza',
    input: {
      type: 'choice',
      options: [
        'Não estou ansiosa ou deprimida',
        'Estou levemente ansiosa ou deprimida',
        'Estou moderadamente ansiosa ou deprimida',
        'Estou muito ansiosa ou deprimida',
        'Estou extremamente ansiosa ou deprimida',
      ],
    },
  },
  {
    key: 'vas',
    kicker: 'De 0 a 100: 100 é a melhor saúde que você pode imaginar, 0 é a pior.',
    title: 'Como está a sua saúde HOJE?',
    input: {
      type: 'vas',
      minLabel: 'A pior saúde que você pode imaginar',
      maxLabel: 'A melhor saúde que você pode imaginar',
    },
  },
  {
    key: 'mood_interest',
    kicker: MOOD_KICKER,
    title: 'Pouco interesse ou prazer em fazer as coisas',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_down',
    kicker: MOOD_KICKER,
    title: 'Se sentir para baixo, deprimida ou sem perspectiva',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_nervous',
    kicker: MOOD_KICKER,
    title: 'Se sentir nervosa, ansiosa ou muito tensa',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_worry',
    kicker: MOOD_KICKER,
    title: 'Não conseguir parar ou controlar as preocupações',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'svc_gp',
    kicker: SERVICE_KICKER,
    title: 'Foi a um médico clínico geral?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_specialist',
    kicker: SERVICE_KICKER,
    title: 'Foi a um médico especialista (por exemplo, cardiologista, neurologista)?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_psychiatrist',
    kicker: SERVICE_KICKER,
    title: 'Foi a um psiquiatra?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_psychologist',
    kicker: SERVICE_KICKER,
    title: 'Foi a um psicólogo ou terapeuta?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_urgent',
    kicker: SERVICE_KICKER,
    title: 'Foi a um pronto atendimento?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_er',
    kicker: SERVICE_KICKER,
    title: 'Foi a um pronto-socorro?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'svc_inpatient',
    kicker: SERVICE_KICKER,
    title: 'Ficou internada em um hospital por pelo menos uma noite?',
    input: { type: 'number', placeholder: 'Número de vezes', allowUnknown: true },
  },
  {
    key: 'trabalho_employed',
    kicker:
      'As próximas perguntas são sobre como problemas de saúde, físicos ou emocionais, afetaram seu trabalho e suas atividades nos últimos 7 dias.',
    title: 'Você trabalha atualmente (com remuneração)?',
    input: { type: 'choice', options: ['Sim', 'Não'] },
  },
  {
    key: 'trabalho_missed',
    kicker:
      'Inclua dias de licença, atrasos e saídas mais cedo por causa da sua saúde. Não conte o tempo desta pesquisa.',
    title: 'Nos últimos 7 dias, quantas horas de trabalho você perdeu por problemas de saúde?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_other',
    kicker: 'Por exemplo: férias, feriados ou folgas.',
    title: 'Nos últimos 7 dias, quantas horas de trabalho você perdeu por outros motivos?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_hours',
    title: 'Nos últimos 7 dias, quantas horas você trabalhou de fato?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_productivity',
    title: 'Nos últimos 7 dias, quanto a sua saúde atrapalhou a sua produtividade enquanto trabalhava?',
    input: {
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: 'Não atrapalhou em nada',
      maxLabel: 'Me impediu totalmente de trabalhar',
    },
    requiresWork: true,
  },
  {
    key: 'trabalho_daily',
    title: 'Nos últimos 7 dias, quanto a sua saúde atrapalhou suas atividades do dia a dia, fora o trabalho?',
    input: {
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: 'Não atrapalhou em nada',
      maxLabel: 'Me impediu totalmente',
    },
  },
];

export function visibleHealthSurveySteps(answers: Record<string, string>): HealthSurveyStep[] {
  const employed = answers.trabalho_employed === 'Sim';
  return HEALTH_SURVEY_STEPS.filter((step) => !step.requiresWork || employed);
}

export function isStepAnswered(step: HealthSurveyStep, value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  if (step.input.type === 'number' && value !== UNKNOWN_ANSWER && Number.isNaN(Number(value))) {
    return false;
  }
  return true;
}

export function persistableAnswers(answers: Record<string, string>): Record<string, string> {
  const allowed = new Set(visibleHealthSurveySteps(answers).map((step) => step.key));
  return Object.fromEntries(Object.entries(answers).filter(([key]) => allowed.has(key)));
}

/** Score stays server-side. UI must never render this number. */
export function healthSurveyScore(answers: Record<string, string>): number {
  const vas = Number(answers.vas);
  return Number.isFinite(vas) ? vas : 0;
}
