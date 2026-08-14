import type { NavigationContainerRefWithCurrent, NavigatorScreenParams } from '@react-navigation/native';

import { supabase } from '@/integrations/supabase/client';
import type { PushNotificationData } from '@/services/pushNotifications';
import type { Insight } from '@/hooks/useExploreInsights';
import type { ChatInsightParam } from '@/types/chatInsight';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { buildExploreChatInsight } from '@/utils/buildExploreChatInsight';
import { stashPendingChatInsight } from '@/utils/navigateToChat';

export type MainTabsPushNavigationParams = NavigatorScreenParams<MainTabParamList>;

export type PendingPushTarget =
  | { kind: 'mainTabs'; target: MainTabsPushNavigationParams }
  | { kind: 'checkIn'; checkInType: 'morning' | 'post_training' }
  | { kind: 'yesterdayJourney' }
  | { kind: 'weeklyInsight'; weekStart?: string };

let pendingPushTarget: PendingPushTarget | null = null;

function parseTruthy(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function readNotificationType(data: PushNotificationData): string | undefined {
  return readString(data.notificationType) ?? readString(data.notification_type);
}

function readCheckInType(data: PushNotificationData): 'morning' | 'post_training' | null {
  const raw =
    readString(data.checkInType) ??
    readString(data.checkinType) ??
    readString(data.checkin_type);

  if (raw === 'morning' || raw === 'post_training') {
    return raw;
  }

  const notificationType = readNotificationType(data);
  if (notificationType === 'morning_checkin' || notificationType === 'daily_checkin') {
    return 'morning';
  }
  if (notificationType === 'post_training_checkin') {
    return 'post_training';
  }

  return null;
}

export function resolvePushTargetFromData(
  data: PushNotificationData | undefined,
): PendingPushTarget | null {
  if (!data) {
    return null;
  }

  const notificationType = readNotificationType(data);
  const checkInType = readCheckInType(data);

  if (checkInType) {
    return { kind: 'checkIn', checkInType };
  }

  if (notificationType === 'yesterday_journey' || data.insightType === 'yesterday_journey') {
    return { kind: 'yesterdayJourney' };
  }

  if (
    notificationType === 'weekly_insight' ||
    data.tab === 'History' ||
    parseTruthy(data.openDeepInsight)
  ) {
    return {
      kind: 'weeklyInsight',
      weekStart: readString(data.weekStart) ?? readString(data.week_start),
    };
  }

  if (notificationType === 'streak' || data.tab === 'Explore') {
    return { kind: 'mainTabs', target: { screen: 'Explore' } };
  }

  if (notificationType === 'reengagement' || data.tab === 'Chat') {
    return { kind: 'mainTabs', target: { screen: 'Chat' } };
  }

  if (data.tab === 'Activities') {
    return { kind: 'checkIn', checkInType: 'morning' };
  }

  if (data.screen === 'CheckIn') {
    return { kind: 'checkIn', checkInType: 'morning' };
  }

  if (data.screen === 'MainTabs') {
    return { kind: 'mainTabs', target: { screen: 'Chat' } };
  }

  return null;
}

export function stashPendingPushTarget(target: PendingPushTarget): void {
  pendingPushTarget = target;
}

export function takePendingPushTarget(): PendingPushTarget | null {
  const target = pendingPushTarget;
  pendingPushTarget = null;
  return target;
}

const APP_READY_ROUTES = new Set<keyof RootStackParamList>([
  'MainTabs',
  'Settings',
  'CrisisResources',
  'PsychologicalAssessment',
  'CheckIn',
]);

function canNavigateFromPush(
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
  return APP_READY_ROUTES.has(activeRoute.name as keyof RootStackParamList);
}

function navigateToMainTabs(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  target: MainTabsPushNavigationParams,
): boolean {
  if (!canNavigateFromPush(navigationRef)) {
    stashPendingPushTarget({ kind: 'mainTabs', target });
    return false;
  }

  navigationRef.navigate('MainTabs', target, { pop: true });
  return true;
}

function navigateToCheckIn(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  checkInType: 'morning' | 'post_training',
): boolean {
  if (!canNavigateFromPush(navigationRef)) {
    stashPendingPushTarget({ kind: 'checkIn', checkInType });
    return false;
  }

  navigationRef.navigate('CheckIn', {
    screen: 'CheckInFlow',
    params: { type: checkInType },
  });
  return true;
}

async function fetchYesterdayJourneyInsight(userId: string): Promise<Insight | null> {
  const { data, error } = await supabase
    .from('user_insights')
    .select(
      'title, description, locked, context_summary, internal_context, conversation_id',
    )
    .eq('user_id', userId)
    .eq('insight_type', 'yesterday_journey')
    .maybeSingle();

  if (error || !data || data.locked) {
    return null;
  }

  return {
    title: data.title,
    description: data.description,
    locked: false,
    contextSummary: data.context_summary ?? data.title,
    internalContext: data.internal_context ?? data.description,
    conversationId: data.conversation_id ?? undefined,
  };
}

async function navigateToYesterdayJourney(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  userId: string | undefined,
): Promise<boolean> {
  if (!userId) {
    stashPendingPushTarget({ kind: 'yesterdayJourney' });
    return false;
  }

  if (!canNavigateFromPush(navigationRef)) {
    stashPendingPushTarget({ kind: 'yesterdayJourney' });
    return false;
  }

  const insight = await fetchYesterdayJourneyInsight(userId);
  if (!insight) {
    return navigateToMainTabs(navigationRef, { screen: 'Explore' });
  }

  const chatInsight: ChatInsightParam = buildExploreChatInsight(
    'yesterday_journey',
    insight,
    'text',
  );
  stashPendingChatInsight(chatInsight);

  return navigateToMainTabs(navigationRef, {
    screen: 'Chat',
    params: {
      chatInsight,
      screen: 'TextChat',
    },
  });
}

export async function navigatePushTarget(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  target: PendingPushTarget,
  userId?: string,
): Promise<boolean> {
  if (target.kind === 'checkIn') {
    return navigateToCheckIn(navigationRef, target.checkInType);
  }

  if (target.kind === 'yesterdayJourney') {
    return navigateToYesterdayJourney(navigationRef, userId);
  }

  if (target.kind === 'weeklyInsight') {
    return navigateToMainTabs(navigationRef, {
      screen: 'History',
      params: {
        openDeepInsight: true,
        ...(target.weekStart ? { weekStart: target.weekStart } : {}),
      },
    });
  }

  return navigateToMainTabs(navigationRef, target.target);
}

export async function navigateFromPushNotification(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  data: PushNotificationData | undefined,
  userId?: string,
): Promise<boolean> {
  const target = resolvePushTargetFromData(data);
  if (!target) {
    return false;
  }

  return navigatePushTarget(navigationRef, target, userId);
}

export async function flushPendingPushNavigation(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
  userId?: string,
): Promise<boolean> {
  const target = takePendingPushTarget();
  if (!target) {
    return false;
  }

  return navigatePushTarget(navigationRef, target, userId);
}
