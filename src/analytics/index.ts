export { EVENT_CATALOG } from '@/analytics/catalog';
export { enrichAnalyticsParams } from '@/analytics/enrichParams';
export {
  ABANDON_REASON_LABELS,
  AUTH_METHOD_LABELS,
  CHECKIN_LABELS,
  INSIGHT_LABELS,
  TAB_LABELS,
} from '@/analytics/labels';
export { AnalyticsUserSync } from '@/analytics/AnalyticsUserSync';
export { OnboardingAbandonmentTracker } from '@/analytics/OnboardingAbandonmentTracker';
export {
  initAnalytics,
  logActionEvent,
  logClickEvent,
  logLogin,
  logScreenView,
  logSignUp,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  syncAnalyticsUserProfile,
} from '@/analytics/analytics.service';
export { ACTION_EVENTS, CLICK_EVENTS } from '@/analytics/events';
export { resolveScreenAnalytics, resolveScreenEventName } from '@/analytics/screenEvents';
export type { ScreenAnalytics } from '@/analytics/screenEvents';
export { getActiveRoutePath } from '@/analytics/navigationAnalytics';
export type { AnalyticsParams, AuthAnalyticsMethod } from '@/analytics/types';
