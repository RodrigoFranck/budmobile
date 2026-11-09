export const HEALTH_SURVEY_INSTRUMENT = 'health_survey';
export const UNKNOWN_ANSWER = 'Não sei';
export const HEALTH_SURVEY_QUESTION_COUNT = 23;
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
  support?: string;
  input: SurveyInput;
  requiresWork?: boolean;
  requiresWorkedHours?: boolean;
};

const QV_KICKER = 'Escolha a frase que melhor descreve a sua saúde HOJE.';
const PHQ_KICKER =
  'Durante as últimas 2 semanas, com que frequência você foi incomodada por qualquer um dos problemas abaixo?';
const GAD_KICKER =
  'Durante as últimas 2 semanas, com que frequência você foi incomodada pelos problemas abaixo?';
const SERVICE_KICKER = 'Nos últimos 30 dias, quantas vezes você…';
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
    kicker: PHQ_KICKER,
    title: 'Pouco interesse ou pouco prazer em fazer as coisas',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_down',
    kicker: PHQ_KICKER,
    title: 'Se sentir “para baixo”, deprimida ou sem perspectiva',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_nervous',
    kicker: GAD_KICKER,
    title: 'Sentir-se nervosa, ansiosa ou muito tensa',
    input: { type: 'choice', options: MOOD_OPTIONS },
  },
  {
    key: 'mood_worry',
    kicker: GAD_KICKER,
    title: 'Não ser capaz de impedir ou de controlar as preocupações',
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
      'As questões abaixo perguntam a respeito do efeito dos seus problemas de saúde na sua capacidade de trabalhar e realizar atividades regularmente. Por problemas de saúde estamos nos referindo a qualquer problema físico ou emocional ou sintoma.',
    title: 'Você está atualmente empregada (trabalho remunerado)?',
    input: { type: 'choice', options: ['Sim', 'Não'] },
  },
  {
    key: 'trabalho_missed',
    kicker:
      'As próximas questões se referem aos últimos sete dias, não incluindo o dia de hoje. Inclua as horas não trabalhadas quando você esteve doente, chegou atrasada, saiu mais cedo etc., por causa de sua saúde. Não inclua o tempo que você perdeu para participar desta pesquisa.',
    title: 'Durante os últimos sete dias, quantas horas você deixou de trabalhar por causa dos seus problemas de saúde?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_other',
    title:
      'Durante os últimos sete dias, quantas horas você deixou de trabalhar por causa de qualquer outra razão, como férias, feriados, tempo livre para participar desta pesquisa?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_hours',
    title: 'Durante os últimos sete dias, quantas horas você trabalhou?',
    input: { type: 'number', placeholder: 'Horas' },
    requiresWork: true,
  },
  {
    key: 'trabalho_productivity',
    title:
      'Durante os últimos sete dias, quanto os seus problemas de saúde afetaram a sua produtividade enquanto você estava trabalhando?',
    support:
      'Pense nos dias em que você esteve limitada na quantidade ou tipo de trabalho que você poderia fazer, dias em que você fez menos do que gostaria, ou dias em que você foi menos cuidadosa do que o normal no seu trabalho. Se os problemas de saúde afetaram seu trabalho só um pouco, escolha um número baixo. Escolha um número alto se os problemas de saúde afetaram demais o seu trabalho.',
    input: {
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: 'Problemas de saúde não afetaram meu trabalho',
      maxLabel: 'Problemas de saúde me impediram completamente de trabalhar',
    },
    requiresWork: true,
    requiresWorkedHours: true,
  },
  {
    key: 'trabalho_daily',
    title:
      'Durante os últimos sete dias, quanto seus problemas de saúde afetaram a sua capacidade de fazer suas atividades regulares diárias (outras além do trabalho no seu emprego)?',
    support:
      'Por atividades regulares, queremos dizer atividades comuns que você faz em casa, fazer compras, cuidar das crianças, ginástica, estudo etc. Pense nas vezes em que você esteve limitada na quantidade ou tipo de atividades que você pode fazer e nas vezes em que você fez menos do que gostaria. Se os problemas de saúde afetaram suas atividades só um pouco, escolha um número baixo. Escolha um número alto se os problemas de saúde afetaram demais suas atividades.',
    input: {
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: 'Problemas de saúde não afetaram minhas atividades diárias',
      maxLabel: 'Problemas de saúde me impediram completamente de fazer minhas atividades diárias',
    },
  },
];

export function visibleHealthSurveySteps(answers: Record<string, string>): HealthSurveyStep[] {
  const employed = answers.trabalho_employed === 'Sim';
  const hoursRaw = answers.trabalho_hours;
  const hoursWorked = hoursRaw === undefined || hoursRaw === '' ? null : Number(hoursRaw);
  const skipProductivity =
    employed && hoursWorked !== null && Number.isFinite(hoursWorked) && hoursWorked === 0;

  return HEALTH_SURVEY_STEPS.filter((step) => {
    if (step.requiresWork && !employed) return false;
    if (step.requiresWorkedHours && skipProductivity) return false;
    return true;
  });
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
