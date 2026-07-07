import messaging from '@react-native-firebase/messaging';

export function registerBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async () => {
    // Notification payloads are displayed by the OS in background.
    // This handler is required for data-only FCM messages.
  });
}
