function trimSlash(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

const LOOPBACK_HOST_RE = /\/\/(127\.0\.0\.1|localhost|10\.0\.2\.2)\b/i;

export function isLoopbackChatUrl(url: string): boolean {
  return LOOPBACK_HOST_RE.test(url);
}

export function rewriteLocalhostForAndroid(url: string, os?: string): string {
  if (os !== 'android') return url;
  return url.replace(/\/\/(127\.0\.0\.1|localhost)\b/i, '//10.0.2.2');
}

export function resolveChatTextUrl({
  functionsUrl = process.env.EXPO_PUBLIC_CHAT_FUNCTIONS_URL,
  supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL,
  os,
}: {
  functionsUrl?: string | null;
  supabaseUrl?: string | null;
  os?: string;
} = {}): string {
  const base = rewriteLocalhostForAndroid(
    trimSlash(functionsUrl?.trim() || supabaseUrl?.trim() || ''),
    os,
  );

  if (!base) return '/functions/v1/chat-text';
  if (/\/functions\/v1\/chat-text$/i.test(base)) return base;
  if (/\/functions\/v1$/i.test(base)) return `${base}/chat-text`;
  return `${base}/functions/v1/chat-text`;
}

export function resolveChatTextRequestUrls({
  functionsUrl = process.env.EXPO_PUBLIC_CHAT_FUNCTIONS_URL,
  supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL,
  os,
}: {
  functionsUrl?: string | null;
  supabaseUrl?: string | null;
  os?: string;
} = {}): { primary: string; fallback?: string } {
  const primary = resolveChatTextUrl({ functionsUrl, supabaseUrl, os });
  if (!isLoopbackChatUrl(functionsUrl?.trim() || '')) {
    return { primary };
  }

  const fallback = resolveChatTextUrl({ functionsUrl: '', supabaseUrl, os });
  if (fallback !== primary && /^https?:\/\//i.test(fallback)) {
    return { primary, fallback };
  }

  return { primary };
}
