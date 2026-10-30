import type * as ExpoLocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const APP_LOCK_FLAG_KEY = 'bud.appLock.enabled';

type LocalAuthModule = typeof ExpoLocalAuthentication;

let localAuthModule: LocalAuthModule | null | undefined;

function getLocalAuth(): LocalAuthModule | null {
  if (localAuthModule !== undefined) {
    return localAuthModule;
  }
  try {
    // requireNativeModule throws if the native binary wasn't rebuilt yet.
    localAuthModule = require('expo-local-authentication') as LocalAuthModule;
  } catch {
    localAuthModule = null;
  }
  return localAuthModule;
}

export type AppLockAuthResult = {
  ok: boolean;
  canceled: boolean;
  unavailable: boolean;
};

export async function readAppLockFlag(): Promise<boolean | null> {
  if (Platform.OS === 'web') return false;
  const value = await SecureStore.getItemAsync(APP_LOCK_FLAG_KEY);
  if (value == null) return null;
  return value === '1';
}

export async function writeAppLockFlag(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(APP_LOCK_FLAG_KEY, enabled ? '1' : '0');
}

export async function canUseAppLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const LocalAuthentication = getLocalAuth();
  if (!LocalAuthentication) return false;
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level >= LocalAuthentication.SecurityLevel.SECRET;
  } catch {
    return false;
  }
}

export async function authenticateWithDevice(promptMessage: string): Promise<AppLockAuthResult> {
  if (Platform.OS === 'web') {
    return { ok: false, canceled: false, unavailable: true };
  }

  const LocalAuthentication = getLocalAuth();
  if (!LocalAuthentication) {
    return { ok: false, canceled: false, unavailable: true };
  }

  const available = await canUseAppLock();
  if (!available) {
    return { ok: false, canceled: false, unavailable: true };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código',
    disableDeviceFallback: false,
    requireConfirmation: false,
  });

  if (result.success) {
    return { ok: true, canceled: false, unavailable: false };
  }

  const error = result.error;
  return {
    ok: false,
    canceled: error === 'user_cancel' || error === 'system_cancel' || error === 'app_cancel',
    unavailable: error === 'not_enrolled' || error === 'not_available' || error === 'passcode_not_set',
  };
}
