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
import * as Linking from 'expo-linking';
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
  navigateFromBudUrl,
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
    // TF-83: never prompt for permission here — only after onb_25 "Ativar lembretes"
    // (or Preferências). Silent token refresh if already granted.
    if (Platform.OS === 'web' || !user?.id || !isFetched || !onboardingCompleted) {
      return;
    }

    if (profile?.push_notifications_enabled === false) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      const token = await registerForPushNotificationsAsync({ request: false });
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
  }, [user?.id, isFetched, onboardingCompleted, profile?.push_notifications_enabled]);

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

    const handleUrl = (url: string) => {
      void navigateFromBudUrl(navigationRef, url, userIdRef.current);
    };

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      openedAppUnsubscribe();
      foregroundUnsubscribe();
      receivedSubscription.remove();
      responseSubscription.remove();
      linkingSubscription.remove();
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
