import { CHECKIN_LABELS } from '@/analytics/labels';
import { psychologicalAssessmentSteps } from '@/features/psychologicalAssessment/psychologicalAssessmentSteps';
import {
  HEALTH_SURVEY_INSTRUMENT,
  HEALTH_SURVEY_STEPS,
} from '@/pages/institution/healthSurvey';
import { SCREENINGS } from '@/pages/institution/screeningCatalog';
import type { V3Preferences } from '@/hooks/useV3Preferences';

const DECLARED_CONTEXT_INTRO =
  'O QUE ESTA PESSOA CONTOU SOBRE SI (fonte atual do app. Se ela atualizar preferências ou refizer atividade/pesquisa, use a versão mais recente. Se isto contradisser memória antiga das conversas, priorize isto. Use naturalmente, nunca cite como ficha):';

const PREFERENCE_FIELDS: { key: keyof V3Preferences; label: string }[] = [
  { key: 'therapy', label: 'Terapia' },
  { key: 'mood', label: 'Como tem se sentido' },
  { key: 'weight', label: 'O que mais pesa agora' },
  { key: 'relationships', label: 'Relações que importam' },
  { key: 'focus', label: 'No que vamos focar' },
  { key: 'sixWeeks', label: 'Daqui a seis semanas' },
  { key: 'helpStyle', label: 'O que te ajuda' },
  { key: 'strengths', label: 'Suas forças' },
  { key: 'blockers', label: 'O que te impede de agir' },
  { key: 'faith', label: 'Fé e espiritualidade' },
  { key: 'neurodivergence', label: 'Neurodivergência' },
  { key: 'interests', label: 'Interesses' },
];

const ACTIVITY_LABELS: Record<string, string> = {
  cinco_porques: 'Cinco Porquês',
  fiee: 'FIEE?',
  mapa_relacoes: 'Mapa de Relações',
  ordenacao_valores: 'Ordenação de Valores',
};

const ACTIVITY_ANSWER_LABELS: Record<string, string> = {
  fisico: 'Físico',
  intelectual: 'Intelectual',
  emocional: 'Emocional',
  social: 'Social',
  p1: 'Primeiro porquê',
  p2: 'Segundo porquê',
  p3: 'Terceiro porquê',
  p4: 'Quarto porquê',
  p5: 'Quinto porquê',
  tipo: 'Tipo de relação',
  nome: 'Pessoa',
  idade: 'Idade da pessoa',
  papel: 'Papel na relação',
  frequencia: 'Frequência',
  ranking: 'O que importa na relação',
  muito: 'Valores que importam muito',
  mais: 'Valores dos quais quer mais',
  menos: 'Valores que importam menos agora',
};

const SLEEP_CHECKIN_LABELS: Record<string, string> = {
  quality: 'Como você dormiu?',
  latency: 'Demorou para pegar no sono?',
  awake: 'Acordou no meio da noite?',
  rest: 'O corpo descansou?',
};

const HEALTH_SURVEY_LABELS = Object.fromEntries(
  HEALTH_SURVEY_STEPS.map((step) => [step.key, step.title]),
);

const SCREENING_STEP_LABELS: Record<string, Record<string, string>> = {
  [HEALTH_SURVEY_INSTRUMENT]: HEALTH_SURVEY_LABELS,
  sleep: { ...SLEEP_CHECKIN_LABELS },
};

for (const [instrument, catalog] of Object.entries(SCREENINGS)) {
  SCREENING_STEP_LABELS[instrument] = {
    ...(SCREENING_STEP_LABELS[instrument] ?? {}),
    ...Object.fromEntries(catalog.steps.map((step) => [step.key, step.title])),
  };
}

const ASSESSMENT_LABELS = Object.fromEntries(
  psychologicalAssessmentSteps.map((step) => [step.key, step.question]),
);

export type DeclaredActivityRecord = {
  activityType: string;
  resultText: string | null;
  responses: Record<string, string>;
  completedAt: string | null;
};

export type DeclaredScreeningRecord = {
  instrument: string;
  responses: Record<string, string>;
  completedAt: string;
};

export type DeclaredAssessmentRecord = {
  responses: Record<string, unknown>;
  completedAt: string;
};

export type DeclaredCheckInRecord = {
  checkinType: string;
  checkinDate: string;
  responses: Record<string, unknown>;
  headline?: string | null;
  analysis?: string | null;
};

export type DeclaredUserRecords = {
  activities: DeclaredActivityRecord[];
  screenings: DeclaredScreeningRecord[];
  assessment: DeclaredAssessmentRecord | null;
  checkins: DeclaredCheckInRecord[];
};

export type DeclaredUserContextInput = {
  name?: string | null;
  age?: string | null;
  gender?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  hobbies?: string[] | null;
  conversationGoal?: string | null;
  initialThoughts?: string | null;
  preferences: V3Preferences;
  records?: DeclaredUserRecords | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function asStringRecord(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(asRecord(value))) {
    if (typeof raw === 'string' && raw.trim()) {
      out[key] = raw.trim();
    } else if (typeof raw === 'number' && Number.isFinite(raw)) {
      out[key] = String(raw);
    } else if (Array.isArray(raw)) {
      const joined = raw
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .join(', ');
      if (joined) out[key] = joined;
    }
  }
  return out;
}

export function joinPrefList(value: string | string[] | null | undefined): string | null {
  if (!value) return null;
  const items = Array.isArray(value) ? value : [value];
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean.join(', ') : null;
}

function dateLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  return day || null;
}

function latestByKey<T>(items: T[], keyOf: (item: T) => string, limit = 8): T[] {
  const seen = new Set<string>();
  const latest: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    latest.push(item);
    if (latest.length >= limit) break;
  }
  return latest;
}

function formatAnswerLines(
  responses: Record<string, unknown>,
  labels?: Record<string, string>,
): string[] {
  const values = asStringRecord(responses);
  return Object.entries(values).map(([key, value]) => {
    const label = labels?.[key] ?? key;
    return `- ${label}: ${value}`;
  });
}

export function formatDeclaredPreferences(
  input: Pick<
    DeclaredUserContextInput,
    | 'name'
    | 'age'
    | 'gender'
    | 'occupation'
    | 'relationship'
    | 'hobbies'
    | 'conversationGoal'
    | 'initialThoughts'
    | 'preferences'
  >,
): string | null {
  const lines: string[] = [];
  const add = (label: string, value: string | null | undefined) => {
    const text = value?.trim();
    if (!text) return;
    lines.push(`- ${label}: ${text}`);
  };

  add('Nome', input.name);
  add('Idade', input.age);
  add('Gênero', input.gender);
  add('Profissão', input.occupation);
  add(
    'Relacionamento',
    joinPrefList(input.preferences.relationships) ? null : input.relationship,
  );
  add(
    'Hobbies',
    joinPrefList(input.preferences.interests) ? null : joinPrefList(input.hobbies),
  );
  add(
    'Objetivo',
    joinPrefList(input.preferences.focus) ? null : input.conversationGoal,
  );
  add('Pensamentos ao abrir', input.initialThoughts);

  for (const field of PREFERENCE_FIELDS) {
    add(field.label, joinPrefList(input.preferences[field.key] as string | string[] | undefined));
  }

  if (lines.length === 0) return null;
  return `Preferências e perfil declarados:\n${lines.join('\n')}`;
}

export function formatDeclaredActivities(activities: DeclaredActivityRecord[]): string | null {
  const latest = latestByKey(activities, (item) => item.activityType, 4);
  if (latest.length === 0) return null;

  const blocks = latest.map((item) => {
    const name = ACTIVITY_LABELS[item.activityType] ?? item.activityType;
    const when = dateLabel(item.completedAt);
    const header = when ? `${name} (${when})` : name;
    const lines = [`- ${header}`];
    if (item.resultText?.trim()) {
      lines.push(`  Retrato: ${item.resultText.trim()}`);
    }
    const answers = formatAnswerLines(item.responses, ACTIVITY_ANSWER_LABELS);
    if (answers.length > 0 && !item.resultText?.trim()) {
      lines.push(...answers.map((line) => `  ${line}`));
    }
    return lines.join('\n');
  });

  return `Atividades mais recentes (última de cada tipo):\n${blocks.join('\n')}`;
}

export function formatDeclaredScreenings(screenings: DeclaredScreeningRecord[]): string | null {
  const latest = latestByKey(screenings, (item) => item.instrument, 8);
  if (latest.length === 0) return null;

  const blocks = latest.map((item) => {
    const catalogTitle =
      item.instrument === HEALTH_SURVEY_INSTRUMENT
        ? 'Pesquisa de saúde'
        : SCREENINGS[item.instrument as keyof typeof SCREENINGS]?.title ?? item.instrument;
    const when = dateLabel(item.completedAt);
    const header = when ? `${catalogTitle} (${when})` : catalogTitle;
    const answers = formatAnswerLines(item.responses, SCREENING_STEP_LABELS[item.instrument]);
    if (answers.length === 0) {
      return `- ${header}`;
    }
    return `- ${header}\n${answers.map((line) => `  ${line}`).join('\n')}`;
  });

  return `Pesquisas e rastreios (última de cada instrumento, autorrelato — não diagnostique):\n${blocks.join('\n')}`;
}

export function formatDeclaredAssessment(
  assessment: DeclaredAssessmentRecord | null,
): string | null {
  if (!assessment) return null;
  const answers = formatAnswerLines(assessment.responses, ASSESSMENT_LABELS);
  if (answers.length === 0) return null;
  const when = dateLabel(assessment.completedAt);
  const header = when
    ? `Avaliação psicológica (${when})`
    : 'Avaliação psicológica';
  return `${header}:\n${answers.join('\n')}`;
}

export function formatDeclaredCheckIns(checkins: DeclaredCheckInRecord[]): string | null {
  const latest = checkins.slice(0, 3);
  if (latest.length === 0) return null;

  const blocks = latest.map((item) => {
    const name =
      CHECKIN_LABELS[item.checkinType as keyof typeof CHECKIN_LABELS] ?? item.checkinType;
    const header = `${name} (${item.checkinDate})`;
    const lines = [`- ${header}`];
    if (item.headline?.trim()) {
      lines.push(`  Leitura: ${item.headline.trim()}`);
    }
    if (item.analysis?.trim()) {
      const analysis =
        item.analysis.trim().length > 360
          ? `${item.analysis.trim().slice(0, 357).trim()}...`
          : item.analysis.trim();
      lines.push(`  ${analysis}`);
    }
    if (!item.headline && !item.analysis) {
      const answers = formatAnswerLines(item.responses);
      lines.push(...answers.map((line) => `  ${line}`));
    }
    return lines.join('\n');
  });

  return `Check-ins recentes:\n${blocks.join('\n')}`;
}

export function formatDeclaredUserContext(input: DeclaredUserContextInput): string | null {
  const parts = [
    formatDeclaredPreferences(input),
    formatDeclaredActivities(input.records?.activities ?? []),
    formatDeclaredScreenings(input.records?.screenings ?? []),
    formatDeclaredAssessment(input.records?.assessment ?? null),
    formatDeclaredCheckIns(input.records?.checkins ?? []),
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;
  return `${DECLARED_CONTEXT_INTRO}\n\n${parts.join('\n\n')}`;
}
