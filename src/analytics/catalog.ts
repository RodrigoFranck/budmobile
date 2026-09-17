export type AnalyticsFeature =
  | 'navigation'
  | 'explore'
  | 'chat'
  | 'checkin'
  | 'onboarding'
  | 'assessment'
  | 'history'
  | 'settings'
  | 'auth';

export type AnalyticsEventMeta = {
  label: string;
  feature: AnalyticsFeature;
  featureLabel: string;
};

export const EVENT_CATALOG: Record<string, AnalyticsEventMeta> = {
  tab_select: {
    label: 'Aba selecionada',
    feature: 'navigation',
    featureLabel: 'Navegação',
  },
  checkin_open_from_home: {
    label: 'Check-in aberto pela home',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  explore_insight_message_tap: {
    label: 'Insight aberto em texto',
    feature: 'explore',
    featureLabel: 'Explorar',
  },
  explore_insight_voice_tap: {
    label: 'Insight aberto em voz',
    feature: 'explore',
    featureLabel: 'Explorar',
  },
  history_conversation_open: {
    label: 'Conversa aberta no histórico',
    feature: 'history',
    featureLabel: 'Histórico',
  },
  history_insight_open: {
    label: 'Deep insight aberto',
    feature: 'history',
    featureLabel: 'Histórico',
  },
  settings_assessment_open: {
    label: 'Avaliação psicológica aberta',
    feature: 'settings',
    featureLabel: 'Configurações',
  },
  checkin_intro_start: {
    label: 'Check-in iniciado na intro',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  checkin_type_select: {
    label: 'Tipo de check-in selecionado',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  assessment_start: {
    label: 'Avaliação psicológica iniciada',
    feature: 'assessment',
    featureLabel: 'Avaliação psicológica',
  },
  chat_message_send: {
    label: 'Mensagem enviada',
    feature: 'chat',
    featureLabel: 'Chat',
  },
  voice_session_start: {
    label: 'Sessão de voz iniciada',
    feature: 'chat',
    featureLabel: 'Chat',
  },
  voice_session_end: {
    label: 'Sessão de voz encerrada',
    feature: 'chat',
    featureLabel: 'Chat',
  },
  checkin_start: {
    label: 'Check-in iniciado',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  checkin_complete: {
    label: 'Check-in concluído',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  checkin_abandon: {
    label: 'Check-in abandonado',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  checkin_intro_abandon: {
    label: 'Check-in abandonado na intro',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  checkin_report_view: {
    label: 'Relatório de check-in visualizado',
    feature: 'checkin',
    featureLabel: 'Check-in',
  },
  assessment_complete: {
    label: 'Avaliação psicológica concluída',
    feature: 'assessment',
    featureLabel: 'Avaliação psicológica',
  },
  assessment_abandon: {
    label: 'Avaliação psicológica abandonada',
    feature: 'assessment',
    featureLabel: 'Avaliação psicológica',
  },
  onboarding_complete: {
    label: 'Onboarding concluído',
    feature: 'onboarding',
    featureLabel: 'Onboarding',
  },
  onboarding_abandon: {
    label: 'Onboarding abandonado',
    feature: 'onboarding',
    featureLabel: 'Onboarding',
  },
  explore_insight_view: {
    label: 'Card de insight visualizado',
    feature: 'explore',
    featureLabel: 'Explorar',
  },
  explore_insight_blocked: {
    label: 'Tentativa em insight bloqueado',
    feature: 'explore',
    featureLabel: 'Explorar',
  },
  auth_sign_out: {
    label: 'Logout',
    feature: 'auth',
    featureLabel: 'Autenticação',
  },
};
