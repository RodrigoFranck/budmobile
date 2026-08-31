import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

import { enrichAnalyticsParams } from '@/analytics/enrichParams';
import { BOOLEAN_LABELS, THEME_PREFERENCE_LABELS } from '@/analytics/labels';
import type { ScreenAnalytics } from '@/analytics/screenEvents';
import type { AnalyticsParams, AuthAnalyticsMethod } from '@/analytics/types';

import appConfig from '../../app.json';

const APP_VERSION = appConfig.expo.version;

let analyticsInitialized = false;

function sanitizeParams(params?: AnalyticsParams): AnalyticsParams | undefined {
  if (!params) {
    return undefined;
  }

  const sanitized: AnalyticsParams = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'boolean') {
      sanitized[key] = value ? 'true' : 'false';
      continue;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string' && value.length > 0) {
      sanitized[key] = value.slice(0, 100);
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

async function runAnalyticsTask(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    if (__DEV__) {
      console.warn('[analytics]', error);
    }
  }
}

export async function initAnalytics(): Promise<void> {
  if (analyticsInitialized) {
    return;
  }

  analyticsInitialized = true;

  await runAnalyticsTask(async () => {
    await analytics().setAnalyticsCollectionEnabled(true);

    if (__DEV__) {
      await analytics().logEvent('analytics_debug_ping', {
        platform: Platform.OS,
        app_version: APP_VERSION,
      });
      console.log('[analytics] debug ping sent', Platform.OS);
    }
  });
}

export async function logScreenView(screen: ScreenAnalytics): Promise<void> {
  await runAnalyticsTask(async () => {
    await analytics().logScreenView({
      screen_name: screen.title,
      screen_class: screen.id,
    });
  });
}

export async function logClickEvent(
  eventName: string,
  params?: AnalyticsParams,
): Promise<void> {
  await runAnalyticsTask(async () => {
    await analytics().logEvent(
      eventName,
      sanitizeParams(enrichAnalyticsParams(eventName, params)),
    );
  });
}

export async function logActionEvent(
  eventName: string,
  params?: AnalyticsParams,
): Promise<void> {
  await logClickEvent(eventName, params);
}

export async function logLogin(method: AuthAnalyticsMethod): Promise<void> {
  await runAnalyticsTask(async () => {
    await analytics().logLogin({ method });
  });
}

export async function logSignUp(method: AuthAnalyticsMethod): Promise<void> {
  await runAnalyticsTask(async () => {
    await analytics().logSignUp({ method });
  });
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  await runAnalyticsTask(async () => {
    await analytics().setUserId(userId);
  });
}

export async function setAnalyticsUserProperties(
  properties: Record<string, string | null | undefined>,
): Promise<void> {
  const entries = Object.entries(properties).filter(
    ([, value]) => value !== undefined && value !== null && value.length > 0,
  );

  if (entries.length === 0) {
    return;
  }

  await runAnalyticsTask(async () => {
    await analytics().setUserProperties(
      Object.fromEntries(entries.map(([key, value]) => [key, value as string])),
    );
  });
}

export async function syncAnalyticsUserProfile(input: {
  userId: string | null;
  onboardingCompleted?: boolean;
  themePreference?: string;
}): Promise<void> {
  await setAnalyticsUserId(input.userId);

  if (!input.userId) {
    return;
  }

  await setAnalyticsUserProperties({
    app_version: APP_VERSION,
    onboarding_completed:
      input.onboardingCompleted === undefined
        ? undefined
        : input.onboardingCompleted
          ? 'true'
          : 'false',
    onboarding_completed_label:
      input.onboardingCompleted === undefined
        ? undefined
        : BOOLEAN_LABELS[input.onboardingCompleted ? 'true' : 'false'],
    theme_preference: input.themePreference,
    theme_preference_label: input.themePreference
      ? THEME_PREFERENCE_LABELS[
          input.themePreference as keyof typeof THEME_PREFERENCE_LABELS
        ]
      : undefined,
  });
}
