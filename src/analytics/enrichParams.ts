import { EVENT_CATALOG } from '@/analytics/catalog';
import {
  ABANDON_REASON_LABELS,
  AUTH_METHOD_LABELS,
  BOOLEAN_LABELS,
  CHECKIN_LABELS,
  CHECKIN_REPORT_SOURCE_LABELS,
  EXPLORE_INTERACTION_LABELS,
  EXPLORE_VIEW_METHOD_LABELS,
  INSIGHT_LABELS,
  ONBOARDING_STEP_LABELS,
  TAB_LABELS,
  THEME_PREFERENCE_LABELS,
} from '@/analytics/labels';
import type { AnalyticsParams } from '@/analytics/types';

type LabelResolver = (value: string) => string | undefined;

const VALUE_LABEL_RESOLVERS: Record<string, LabelResolver> = {
  tab: (value) => TAB_LABELS[value as keyof typeof TAB_LABELS],
  insight_type: (value) => INSIGHT_LABELS[value as keyof typeof INSIGHT_LABELS],
  checkin_type: (value) => CHECKIN_LABELS[value as keyof typeof CHECKIN_LABELS],
  interaction: (value) =>
    EXPLORE_INTERACTION_LABELS[value as keyof typeof EXPLORE_INTERACTION_LABELS] ??
    EXPLORE_VIEW_METHOD_LABELS[value as keyof typeof EXPLORE_VIEW_METHOD_LABELS],
  view_method: (value) =>
    EXPLORE_VIEW_METHOD_LABELS[value as keyof typeof EXPLORE_VIEW_METHOD_LABELS],
  reason: (value) => ABANDON_REASON_LABELS[value as keyof typeof ABANDON_REASON_LABELS],
  source: (value) => CHECKIN_REPORT_SOURCE_LABELS[value as keyof typeof CHECKIN_REPORT_SOURCE_LABELS],
  last_step: (value) => ONBOARDING_STEP_LABELS[value] ?? value,
  method: (value) => AUTH_METHOD_LABELS[value as keyof typeof AUTH_METHOD_LABELS],
  theme_preference: (value) =>
    THEME_PREFERENCE_LABELS[value as keyof typeof THEME_PREFERENCE_LABELS],
  is_locked: (value) => BOOLEAN_LABELS[value as keyof typeof BOOLEAN_LABELS],
  has_insight_context: (value) => BOOLEAN_LABELS[value as keyof typeof BOOLEAN_LABELS],
  onboarding_completed: (value) => BOOLEAN_LABELS[value as keyof typeof BOOLEAN_LABELS],
};

function appendValueLabel(
  enriched: AnalyticsParams,
  key: string,
  value: AnalyticsParams[string],
): void {
  if (typeof value !== 'string') {
    return;
  }

  const resolver = VALUE_LABEL_RESOLVERS[key];
  if (!resolver) {
    return;
  }

  const label = resolver(value);
  if (label) {
    enriched[`${key}_label`] = label;
  }
}

export function enrichAnalyticsParams(
  eventName: string,
  params?: AnalyticsParams,
): AnalyticsParams {
  const enriched: AnalyticsParams = { ...(params ?? {}) };
  const catalog = EVENT_CATALOG[eventName];

  if (catalog) {
    enriched.event_label = catalog.label;
    enriched.feature = catalog.feature;
    enriched.feature_label = catalog.featureLabel;
  }

  for (const [key, value] of Object.entries(enriched)) {
    appendValueLabel(enriched, key, value);
  }

  return enriched;
}
