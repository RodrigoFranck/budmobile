const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export function getSupabaseAuthStorageKey(): string | null {
  if (!SUPABASE_URL) return null;
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    const projectRef = hostname.split('.')[0];
    if (!projectRef) return null;
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}
