import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

export function registerBackgroundMessageHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async () => {
    // Notification payloads are displayed by the OS in background.
    // This handler is required for data-only FCM messages.
  });
}
