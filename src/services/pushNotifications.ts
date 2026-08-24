import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

let storedPushToken: string | null = null;

export function getStoredPushToken(): string | null {
  return storedPushToken;
}

export function clearStoredPushToken(): void {
  storedPushToken = null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureIosRegisteredForRemoteMessages(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging().registerDeviceForRemoteMessages();
  }
}

async function getFcmTokenAsync(): Promise<string | null> {
  await ensureIosRegisteredForRemoteMessages();

  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

function canRegisterForPushOnThisDevice(): boolean {
  if (Device.isDevice) {
    return true;
  }

  // Android emulator with Google Play can receive FCM tokens in development.
  return __DEV__ && Platform.OS === 'android';
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  return true;
}

async function configureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: 'Bud',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const granted = await requestNotificationPermissionAsync();
  if (!granted) {
    return null;
  }

  await configureAndroidNotificationChannel();

  if (!canRegisterForPushOnThisDevice()) {
    return null;
  }

  return getFcmTokenAsync();
}

export async function savePushTokenForUser(
  userId: string,
  pushToken: string
): Promise<void> {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: pushToken,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' }
  );

  if (error) {
    console.error('Error saving push token:', error.message, error.code);
    return;
  }

  storedPushToken = pushToken;
}

export async function removePushTokenForUser(
  userId: string,
  pushToken: string
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', pushToken);

  if (error) {
    console.error('Error removing push token:', error.message, error.code);
    return;
  }
}

export async function removeAllPushTokensForUser(userId: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('user_id', userId);

  if (error) {
    console.error('Error removing all push tokens:', error.message, error.code);
    return;
  }

  clearStoredPushToken();
}

export async function syncPushTokenForUser(userId: string): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    return null;
  }

  await savePushTokenForUser(userId, token);
  return token;
}

export type PushNotificationData = {
  screen?: string;
  tab?: string;
  notificationType?: string;
  notification_type?: string;
  openDeepInsight?: boolean | string;
  conversationId?: string;
  checkInType?: string;
  checkinType?: string;
  checkin_type?: string;
  insightType?: string;
  weekStart?: string;
  week_start?: string;
  [key: string]: unknown;
};

export async function displayRemoteMessageAsNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const title = remoteMessage.notification?.title;
  const body = remoteMessage.notification?.body;

  if (!title && !body) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title ?? 'Bud',
      body: body ?? '',
      data: (remoteMessage.data ?? {}) as Record<string, unknown>,
    },
    trigger: null,
  });
}

export function getPushDataFromRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): PushNotificationData {
  return (remoteMessage.data ?? {}) as PushNotificationData;
}
