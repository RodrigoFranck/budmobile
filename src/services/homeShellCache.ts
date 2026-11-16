import * as SecureStore from 'expo-secure-store';

import type { HomeRecapItem } from '@/hooks/useHomeRecaps';

export type HomeShellCache = {
  firstName: string;
  hasLetter: boolean;
  recaps: HomeRecapItem[];
  savedAt: string;
};

function storageKey(userId: string) {
  return `home_shell_cache_${userId}`;
}

function isRecapItem(value: unknown): value is HomeRecapItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<HomeRecapItem>;
  if (typeof row.id !== 'string' || typeof row.label !== 'string') return false;
  if (typeof row.quote !== 'string' || typeof row.body !== 'string') return false;
  return row.kind === 'yesterday' || row.kind === 'conversation';
}

export async function readHomeShellCache(userId: string): Promise<HomeShellCache | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HomeShellCache>;
    if (typeof parsed.firstName !== 'string' || typeof parsed.hasLetter !== 'boolean') {
      return null;
    }
    if (!Array.isArray(parsed.recaps) || !parsed.recaps.every(isRecapItem)) {
      return null;
    }
    return {
      firstName: parsed.firstName,
      hasLetter: parsed.hasLetter,
      recaps: parsed.recaps,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function writeHomeShellCache(
  userId: string,
  payload: Omit<HomeShellCache, 'savedAt'>,
): Promise<void> {
  try {
    const next: HomeShellCache = {
      ...payload,
      savedAt: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(next));
  } catch {
    // Offline shell cache is best-effort.
  }
}
