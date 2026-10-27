import {
  AGE_OPTIONS,
  MOOD_STOPS,
  ONBOARDING_V3_STEPS,
} from '@/pages/onboardingV3/onboardingSteps';

export const UNANSWERED = 'Não respondido';

export const APP_VERSION = '2.0.20';

export const SUPPORT_TOPICS = ['Problema', 'Dúvida', 'Sugestão', 'Elogio'] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const INTEREST_OPTIONS = ['Livros', 'Filmes e séries', 'Música', 'Natureza', 'Culinária', 'Viagens'] as const;

export const GENDER_OPTIONS = ['Mulher', 'Homem', 'Não binário', 'Outro', 'Prefiro não dizer'] as const;

export const MOOD_OPTIONS = Array.from(new Set(MOOD_STOPS.map((stop) => stop.label)));

export type PrefEditField =
  | 'displayName'
  | 'ageRange'
  | 'gender'
  | 'therapy'
  | 'mood'
  | 'weight'
  | 'relationships'
  | 'focus'
  | 'sixWeeks'
  | 'helpStyle'
  | 'strengths'
  | 'blockers'
  | 'faith'
  | 'neurodivergence'
  | 'interests';

export type PrefEditKind = 'text' | 'single' | 'multi';

export type PrefEditSpec = {
  field: PrefEditField;
  kind: PrefEditKind;
  titleBefore: string;
  titleAccent: string;
  titleAfter?: string;
  subtitle: string;
  options?: readonly string[];
  placeholder?: string;
  maxSelect?: number;
};

function specFromOnboarding(field: PrefEditField, kind: PrefEditKind): PrefEditSpec {
  const step = ONBOARDING_V3_STEPS.find((item) => item.field === field);
  if (!step) {
    throw new Error(`Missing onboarding step for ${field}`);
  }
  return {
    field,
    kind,
    titleBefore: step.title.before,
    titleAccent: step.title.accent,
    titleAfter: step.title.after,
    subtitle: step.subtitle ?? '',
    options: step.options,
    placeholder: step.placeholder,
    maxSelect: step.maxSelect,
  };
}

export const PREF_EDIT_SPECS: Record<PrefEditField, PrefEditSpec> = {
  displayName: specFromOnboarding('displayName', 'text'),
  ageRange: {
    field: 'ageRange',
    kind: 'single',
    titleBefore: 'Quantos anos você ',
    titleAccent: 'tem',
    titleAfter: '?',
    subtitle: 'Escolha a faixa que combina com você.',
    options: AGE_OPTIONS,
  },
  gender: specFromOnboarding('gender', 'single'),
  therapy: specFromOnboarding('therapy', 'single'),
  mood: {
    field: 'mood',
    kind: 'single',
    titleBefore: 'Como você tem se ',
    titleAccent: 'sentido',
    titleAfter: '?',
    subtitle: 'Escolha o que combina com você.',
    options: MOOD_OPTIONS,
  },
  weight: specFromOnboarding('weight', 'multi'),
  relationships: specFromOnboarding('relationships', 'multi'),
  focus: specFromOnboarding('focus', 'multi'),
  sixWeeks: specFromOnboarding('sixWeeks', 'multi'),
  helpStyle: specFromOnboarding('helpStyle', 'multi'),
  strengths: specFromOnboarding('strengths', 'multi'),
  blockers: specFromOnboarding('blockers', 'multi'),
  faith: specFromOnboarding('faith', 'single'),
  neurodivergence: specFromOnboarding('neurodivergence', 'single'),
  interests: specFromOnboarding('interests', 'multi'),
};

export const ABOUT_ME_ROWS: { field: PrefEditField; label: string }[] = [
  { field: 'displayName', label: 'Nome' },
  { field: 'ageRange', label: 'Idade' },
  { field: 'gender', label: 'Gênero' },
  { field: 'therapy', label: 'Terapia' },
];

export const MOTIVE_ROWS: { field: PrefEditField; label: string }[] = [
  { field: 'mood', label: 'Como tem se sentido' },
  { field: 'weight', label: 'O que mais pesa agora' },
  { field: 'relationships', label: 'Relações que importam' },
  { field: 'focus', label: 'No que vamos focar' },
  { field: 'sixWeeks', label: 'Daqui a seis semanas' },
  { field: 'helpStyle', label: 'O que te ajuda' },
  { field: 'strengths', label: 'Suas forças' },
  { field: 'blockers', label: 'O que te impede de agir' },
  { field: 'faith', label: 'Fé e espiritualidade' },
  { field: 'neurodivergence', label: 'Neurodivergência' },
];

export const NOTIFICATION_ROWS: {
  key: 'letter' | 'weekly' | 'screening' | 'reminders';
  label: string;
  hint: string;
  icon: 'mail' | 'clock' | 'activity' | 'message';
}[] = [
  { key: 'letter', label: 'Carta do dia', hint: 'Todo dia às 7h', icon: 'mail' },
  { key: 'weekly', label: 'Resumo da semana', hint: 'Domingo às 17h', icon: 'clock' },
  { key: 'screening', label: 'Pesquisa de saúde', hint: 'A cada 3 meses', icon: 'activity' },
  {
    key: 'reminders',
    label: 'Lembretes para conversar',
    hint: 'Quando você some por alguns dias',
    icon: 'message',
  },
];

export function splitPrefList(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(' · ').map((item) => item.trim()).filter(Boolean);
}

export function formatPrefValue(value: string | string[] | null | undefined): string {
  const items = splitPrefList(value);
  if (items.length === 0) return UNANSWERED;
  return items.join(', ');
}
