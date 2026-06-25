import messaging from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/integrations/supabase/client';

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
  } catch (error) {
    console.error('[push] Erro ao obter token FCM:', error);
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return null;
    }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bud',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await getFcmTokenAsync();
  if (token && __DEV__) {
    console.log('[push] FCM token (Firebase Console → Messaging → teste):', token);
  }

  return token;
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
    console.error('[push] Erro ao salvar token:', error.message);
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
    console.error('[push] Erro ao remover token:', error.message);
  }
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
  conversationId?: string;
  [key: string]: unknown;
};
