import type { Session } from '@supabase/supabase-js';
import { getSupabaseAuthStorageKey } from '@/voice/supabaseStorageKey';

function utf8ToBase64(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

export function buildInjectedSessionScript(session: Session): string | null {
  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) return null;

  const json = JSON.stringify(session);
  const b64 = utf8ToBase64(json);
  const keyEscaped = storageKey.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `
(function(){
  try {
    var key = '${keyEscaped}';
    var b64 = '${b64}';
    var json = decodeURIComponent(escape(atob(b64)));
    localStorage.setItem(key, json);
  } catch (e) {}
})();
true;
`;
}
