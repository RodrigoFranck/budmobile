export type ScreenAnalytics = {
  id: string;
  title: string;
  module: string;
  moduleLabel: string;
};

const SCREEN_EVENT_MAP: Record<string, ScreenAnalytics> = {
  Auth: {
    id: 'auth_login',
    title: 'Login e cadastro',
    module: 'auth',
    moduleLabel: 'Autenticação',
  },
  ForgotPassword: {
    id: 'auth_forgot_password',
    title: 'Esqueci a senha',
    module: 'auth',
    moduleLabel: 'Autenticação',
  },
  ResetPassword: {
    id: 'auth_reset_password',
    title: 'Redefinir senha',
    module: 'auth',
    moduleLabel: 'Autenticação',
  },
  Bootstrap: {
    id: 'app_bootstrap',
    title: 'Carregamento inicial',
    module: 'app',
    moduleLabel: 'App',
  },
  Onboarding: {
    id: 'onboarding',
    title: 'Onboarding',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingName: {
    id: 'onboarding_name',
    title: 'Onboarding — Nome',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingAge: {
    id: 'onboarding_age',
    title: 'Onboarding — Idade',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingThoughts: {
    id: 'onboarding_thoughts',
    title: 'Onboarding — Pensamentos',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingExpectations: {
    id: 'onboarding_expectations',
    title: 'Onboarding — Expectativas',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingNotifications: {
    id: 'onboarding_notifications',
    title: 'Onboarding — Notificações',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingVoice: {
    id: 'onboarding_voice',
    title: 'Onboarding — Voz',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  OnboardingReady: {
    id: 'onboarding_ready',
    title: 'Onboarding — Pronto',
    module: 'onboarding',
    moduleLabel: 'Onboarding',
  },
  MainTabs: {
    id: 'main_tabs',
    title: 'Abas principais',
    module: 'navigation',
    moduleLabel: 'Navegação',
  },
  Chat: {
    id: 'chat_home',
    title: 'Chat',
    module: 'chat',
    moduleLabel: 'Chat',
  },
  TextChat: {
    id: 'chat_text',
    title: 'Chat em texto',
    module: 'chat',
    moduleLabel: 'Chat',
  },
  Home: {
    id: 'home',
    title: 'Início',
    module: 'home',
    moduleLabel: 'Início',
  },
  Letter: {
    id: 'letter',
    title: 'Carta',
    module: 'home',
    moduleLabel: 'Início',
  },
  LetterOpen: {
    id: 'letter_open',
    title: 'Carta aberta',
    module: 'home',
    moduleLabel: 'Início',
  },
  Menu: {
    id: 'menu',
    title: 'Menu',
    module: 'navigation',
    moduleLabel: 'Navegação',
  },
  VoiceSelect: {
    id: 'voice_select',
    title: 'Voz do Bud',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  Preferences: {
    id: 'preferences',
    title: 'Preferências',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  AboutMe: {
    id: 'preferences_about_me',
    title: 'Sobre mim',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  Motives: {
    id: 'preferences_motives',
    title: 'O que te trouxe aqui',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  PrefEdit: {
    id: 'preferences_edit',
    title: 'Editar preferência',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  NotificationsPrefs: {
    id: 'preferences_notifications',
    title: 'Notificações',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  Account: {
    id: 'account',
    title: 'Conta e dados',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  DeleteAccount: {
    id: 'account_delete',
    title: 'Excluir conta',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  AccountDeleted: {
    id: 'account_deleted',
    title: 'Conta excluída',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  AboutBud: {
    id: 'about_bud',
    title: 'Sobre o Bud',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  Support: {
    id: 'support',
    title: 'Suporte e feedback',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  SupportSent: {
    id: 'support_sent',
    title: 'Feedback enviado',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  Paywall: {
    id: 'paywall',
    title: 'Assinatura',
    module: 'paywall',
    moduleLabel: 'Assinatura',
  },
  ActivityFlow: {
    id: 'activity_flow',
    title: 'Atividade',
    module: 'activities',
    moduleLabel: 'Atividades',
  },
  Institution: {
    id: 'institution',
    title: 'Pesquisa de saúde',
    module: 'institution',
    moduleLabel: 'Instituição',
  },
  InstitutionOptional: {
    id: 'institution_optional',
    title: 'Pesquisa opcional',
    module: 'institution',
    moduleLabel: 'Instituição',
  },
  SleepCheckIn: {
    id: 'sleep_check_in',
    title: 'Check-in de sono',
    module: 'institution',
    moduleLabel: 'Instituição',
  },
  Screening: {
    id: 'screening',
    title: 'Rastreio clínico',
    module: 'institution',
    moduleLabel: 'Instituição',
  },
  Explore: {
    id: 'explore',
    title: 'Explorar',
    module: 'explore',
    moduleLabel: 'Explorar',
  },
  Activities: {
    id: 'activities',
    title: 'Atividades',
    module: 'activities',
    moduleLabel: 'Atividades',
  },
  ActivitiesHome: {
    id: 'activities_home',
    title: 'Home de atividades',
    module: 'activities',
    moduleLabel: 'Atividades',
  },
  History: {
    id: 'history',
    title: 'Histórico',
    module: 'history',
    moduleLabel: 'Histórico',
  },
  Settings: {
    id: 'settings',
    title: 'Configurações',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  CrisisResources: {
    id: 'crisis_resources',
    title: 'Recursos de crise',
    module: 'settings',
    moduleLabel: 'Configurações',
  },
  PsychologicalAssessment: {
    id: 'assessment',
    title: 'Avaliação psicológica',
    module: 'assessment',
    moduleLabel: 'Avaliação psicológica',
  },
  PsychologicalAssessmentIntro: {
    id: 'assessment_intro',
    title: 'Avaliação — Introdução',
    module: 'assessment',
    moduleLabel: 'Avaliação psicológica',
  },
  PsychologicalAssessmentFlow: {
    id: 'assessment_flow',
    title: 'Avaliação — Perguntas',
    module: 'assessment',
    moduleLabel: 'Avaliação psicológica',
  },
  CheckIn: {
    id: 'checkin',
    title: 'Check-in',
    module: 'checkin',
    moduleLabel: 'Check-in',
  },
  CheckInIntro: {
    id: 'checkin_intro',
    title: 'Check-in — Introdução',
    module: 'checkin',
    moduleLabel: 'Check-in',
  },
  CheckInActivities: {
    id: 'checkin_type_select',
    title: 'Check-in — Escolha do tipo',
    module: 'checkin',
    moduleLabel: 'Check-in',
  },
  CheckInFlow: {
    id: 'checkin_flow',
    title: 'Check-in — Perguntas',
    module: 'checkin',
    moduleLabel: 'Check-in',
  },
  CheckInResult: {
    id: 'checkin_report',
    title: 'Check-in — Relatório',
    module: 'checkin',
    moduleLabel: 'Check-in',
  },
};

function toFallbackScreen(routeName: string): ScreenAnalytics {
  const snake = routeName
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

  return {
    id: snake,
    title: routeName,
    module: 'app',
    moduleLabel: 'App',
  };
}

export function resolveScreenAnalytics(routePath: string): ScreenAnalytics {
  if (SCREEN_EVENT_MAP[routePath]) {
    return SCREEN_EVENT_MAP[routePath];
  }

  const segments = routePath.split('/');
  const leaf = segments[segments.length - 1] ?? routePath;

  if (SCREEN_EVENT_MAP[leaf]) {
    return SCREEN_EVENT_MAP[leaf];
  }

  return toFallbackScreen(leaf);
}

/** @deprecated Use resolveScreenAnalytics().id */
export function resolveScreenEventName(routePath: string): string {
  return resolveScreenAnalytics(routePath).id;
}
