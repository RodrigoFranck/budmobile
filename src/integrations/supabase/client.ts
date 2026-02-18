import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not set!');
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set!');
  throw new Error('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required');
}

// Log configuration (without exposing the full key)
if (__DEV__) {
  console.log('✅ Supabase URL:', SUPABASE_URL);
  console.log('✅ Supabase Key:', SUPABASE_PUBLISHABLE_KEY ? `${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...` : 'NOT SET');
}

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});

