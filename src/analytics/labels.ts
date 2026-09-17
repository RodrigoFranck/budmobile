import type { ExploreInsightKey } from '@/constants/exploreInsights';

export const TAB_LABELS = {
  chat: 'Chat',
  explore: 'Explorar',
  activities: 'Atividades',
  history: 'Histórico',
} as const;

export const INSIGHT_LABELS: Record<ExploreInsightKey, string> = {
  yesterday_journey: 'Jornada de ontem',
  frequency: 'Frequência',
  habit: 'Construir hábito',
};

export const CHECKIN_LABELS = {
  morning: 'Check-in da manhã',
  post_training: 'Check-in pós-treino',
  post_game: 'Check-in pós-jogo',
} as const;

export const AUTH_METHOD_LABELS = {
  email: 'E-mail e senha',
  google: 'Google',
  apple: 'Apple',
} as const;

export const EXPLORE_VIEW_METHOD_LABELS = {
  swipe: 'Deslizar card',
  pagination: 'Indicador lateral',
  initial: 'Abertura da tela',
} as const;

export const EXPLORE_INTERACTION_LABELS = {
  message: 'Mensagem',
  voice: 'Voz',
} as const;

export const ONBOARDING_STEP_LABELS: Record<string, string> = {
  OnboardingName: 'Nome',
  OnboardingAge: 'Idade',
  OnboardingThoughts: 'Pensamentos',
  OnboardingExpectations: 'Expectativas',
  OnboardingNotifications: 'Notificações',
  OnboardingVoice: 'Voz',
  OnboardingReady: 'Pronto',
};

export const ABANDON_REASON_LABELS = {
  app_background: 'App em segundo plano',
  sign_out: 'Logout',
} as const;

export const CHECKIN_REPORT_SOURCE_LABELS = {
  existing: 'Relatório já existente',
  generated: 'Relatório gerado agora',
} as const;

export const BOOLEAN_LABELS = {
  true: 'Sim',
  false: 'Não',
} as const;

export const THEME_PREFERENCE_LABELS = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
} as const;
