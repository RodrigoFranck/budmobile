import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import {
  clearStoredPushToken,
  displayRemoteMessageAsNotification,
  getPushDataFromRemoteMessage,
  getStoredPushToken,
  registerForPushNotificationsAsync,
  removePushTokenForUser,
  savePushTokenForUser,
  type PushNotificationData,
} from '@/services/pushNotifications';
import type { RootStackParamList } from '@/types/navigation';
import {
  flushPendingPushNavigation,
  navigateFromPushNotification,
} from '@/utils/pushNotificationNavigation';

export function usePushNotifications(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>
) {
  const { user, onboardingCompleted } = useAuth();
  const { data: profile, isFetched } = useAppProfileQuery();
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id || !isFetched) {
      return;
    }

    if (profile?.push_notifications_enabled === false) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) {
        return;
      }

      await savePushTokenForUser(user.id, token);
    };

    register();

    const tokenRefreshUnsubscribe = onTokenRefresh(getMessaging(), async (token) => {
      if (cancelled || !token) {
        return;
      }

      await savePushTokenForUser(user.id, token);
    });

    return () => {
      cancelled = true;
      tokenRefreshUnsubscribe();
    };
  }, [user?.id, isFetched, profile?.push_notifications_enabled]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id || !onboardingCompleted) {
      return;
    }

    flushPendingPushNavigation(navigationRef, user.id);
  }, [navigationRef, onboardingCompleted, user?.id]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const messaging = getMessaging();

    void getInitialNotification(messaging).then((remoteMessage) => {
      if (!remoteMessage) {
        return;
      }

      navigateFromPushNotification(
        navigationRef,
        getPushDataFromRemoteMessage(remoteMessage),
        userIdRef.current,
      );
    });

    const openedAppUnsubscribe = onNotificationOpenedApp(messaging, (remoteMessage) => {
      navigateFromPushNotification(
        navigationRef,
        getPushDataFromRemoteMessage(remoteMessage),
        userIdRef.current,
      );
    });

    const foregroundUnsubscribe = onMessage(messaging, async (remoteMessage) => {
      await displayRemoteMessageAsNotification(remoteMessage);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {});

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as PushNotificationData;
        navigateFromPushNotification(navigationRef, data, userIdRef.current);
      }
    );

    return () => {
      openedAppUnsubscribe();
      foregroundUnsubscribe();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [navigationRef]);
}

export async function unregisterPushNotificationsForUser(userId: string): Promise<void> {
  const token = getStoredPushToken();
  if (!token) {
    return;
  }

  await removePushTokenForUser(userId, token);
  clearStoredPushToken();
}
