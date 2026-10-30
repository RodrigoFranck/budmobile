import { supabase } from '@/integrations/supabase/client';
import type { VoiceId } from '@/theme';

const cache = new Map<VoiceId, string>();

export async function fetchVoiceDemoBase64(voice: VoiceId): Promise<string> {
  const hit = cache.get(voice);
  if (hit) return hit;

  const { data, error } = await supabase.functions.invoke('voice-preview', {
    body: { voice },
  });

  if (error) {
    throw new Error(error.message || 'Não foi possível ouvir a voz agora.');
  }

  const audioBase64 = (data as { audioBase64?: string } | null)?.audioBase64;
  if (!audioBase64) {
    throw new Error('Demo da voz indisponível.');
  }

  cache.set(voice, audioBase64);
  return audioBase64;
}
