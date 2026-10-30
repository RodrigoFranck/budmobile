import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREF_KEY = 'bud.theme.preference';

let memoryCache: ThemePreference | null = null;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function peekCachedThemePreference(): ThemePreference | null {
  return memoryCache;
}

export async function readCachedThemePreference(): Promise<ThemePreference | null> {
  if (memoryCache) return memoryCache;
  if (Platform.OS === 'web') return memoryCache;
  const raw = await SecureStore.getItemAsync(THEME_PREF_KEY);
  if (!isThemePreference(raw)) return null;
  memoryCache = raw;
  return raw;
}

export async function writeCachedThemePreference(preference: ThemePreference): Promise<void> {
  memoryCache = preference;
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(THEME_PREF_KEY, preference);
}
