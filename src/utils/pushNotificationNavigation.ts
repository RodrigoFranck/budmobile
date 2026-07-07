import type { NavigationContainerRefWithCurrent, NavigatorScreenParams } from '@react-navigation/native';

import type { PushNotificationData } from '@/services/pushNotifications';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';

export type MainTabsPushNavigationParams = NavigatorScreenParams<MainTabParamList>;

let pendingMainTabsNavigation: MainTabsPushNavigationParams | null = null;

function parseTruthy(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

export function resolveMainTabsNavigationFromPushData(
  data: PushNotificationData | undefined,
): MainTabsPushNavigationParams | null {
  if (!data) {
    return null;
  }

  const notificationType =
    typeof data.notificationType === 'string'
      ? data.notificationType
      : typeof data.notification_type === 'string'
        ? data.notification_type
        : undefined;

  if (notificationType === 'daily_checkin' || data.tab === 'Activities') {
    return {
      screen: 'Activities',
      params: { screen: 'ActivitiesHome' },
    };
  }

  if (
    notificationType === 'weekly_insight' ||
    data.tab === 'History' ||
    parseTruthy(data.openDeepInsight)
  ) {
    return {
      screen: 'History',
      params: { openDeepInsight: true },
    };
  }

  if (data.tab === 'Explore') {
    return { screen: 'Explore' };
  }

  if (data.tab === 'Chat') {
    return { screen: 'Chat' };
  }

  if (data.screen === 'MainTabs') {
    return { screen: 'Chat' };
  }

  return null;
}

export function stashPendingMainTabsNavigation(target: MainTabsPushNavigationParams): void {
  pendingMainTabsNavigation = target;
}

export function takePendingMainTabsNavigation(): MainTabsPushNavigationParams | null {
  const target = pendingMainTabsNavigation;
  pendingMainTabsNavigation = null;
  return target;
}

const MAIN_TABS_ACCESSIBLE_ROUTES = new Set<keyof RootStackParamList>([
  'MainTabs',
  'Settings',
  'CrisisResources',
  'SupportFeedback',
  'PsychologicalAssessment',
]);

function canNavigateToMainTabs(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  const state = navigationRef.getRootState();
  if (!state?.routes.length) {
    return false;
  }

  const activeRoute = state.routes[state.index];
  return MAIN_TABS_ACCESSIBLE_ROUTES.has(activeRoute.name as keyof RootStackParamList);
}

export function navigateToMainTabsFromPush(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  target: MainTabsPushNavigationParams,
): boolean {
  if (!canNavigateToMainTabs(navigationRef)) {
    stashPendingMainTabsNavigation(target);
    return false;
  }

  navigationRef.navigate('MainTabs', target);
  return true;
}

export function navigateFromPushNotification(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  data: PushNotificationData | undefined,
): boolean {
  const target = resolveMainTabsNavigationFromPushData(data);
  if (!target) {
    return false;
  }

  return navigateToMainTabsFromPush(navigationRef, target);
}

export function flushPendingMainTabsNavigation(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
): boolean {
  const target = takePendingMainTabsNavigation();
  if (!target) {
    return false;
  }

  return navigateToMainTabsFromPush(navigationRef, target);
}
