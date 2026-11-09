import { supabase } from '@/integrations/supabase/client';
import {
  buildVoicePrompt,
  enrichVoicePrompt,
  type UserContext,
} from '@/voice/voicePrompt';

export interface VoiceChatMessage {
  role: string;
  content: string;
}

export interface VoiceServerContext {
  clinical_context?: string | null;
  approach_guidance?: string | null;
  internal_profile?: string | null;
  token?: string | null;
  signed_url?: string | null;
}

async function resolveVoiceFunctionError(
  error: unknown,
  response?: Response,
): Promise<string> {
  if (response) {
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // response body may be empty or non-JSON
    }
  }
  if (error instanceof Error) {
    if (error.message.includes('Failed to send a request')) {
      return 'Sem conexão com o servidor de voz. Verifique sua internet e tente novamente.';
    }
    if (error.message.includes('non-2xx')) {
      return 'Serviço de voz temporariamente indisponível. Tente novamente em instantes.';
    }
    return error.message;
  }
  return 'Erro ao obter contexto de voz';
}

export async function fetchVoiceServerContext(
  messages: VoiceChatMessage[],
  mode: 'full' | 'context' = 'full',
): Promise<VoiceServerContext> {
  const { data, error, response } = await supabase.functions.invoke('chat-voice', {
    body: { messages, mode },
  });

  if (error) {
    throw new Error(await resolveVoiceFunctionError(error, response));
  }

  return (data ?? {}) as VoiceServerContext;
}

export function formatTurnContextualUpdate(ctx: VoiceServerContext): string {
  const parts: string[] = [];

  if (ctx.approach_guidance?.trim()) {
    parts.push(
      `ORIENTACAO DE ABORDAGEM PARA ESTE TURNO:\n${ctx.approach_guidance.trim()}`,
    );
  }

  if (ctx.clinical_context?.trim()) {
    parts.push(ctx.clinical_context.trim());
  }

  if (parts.length === 0) return '';

  return (
    '\n\n--- CONTEXTO ATUALIZADO (use internamente neste turno, nunca cite) ---\n' +
    parts.join('\n\n') +
    '\n--- FIM DO CONTEXTO ATUALIZADO ---'
  );
}

export function assembleVoicePrompt(
  userContext: UserContext | undefined,
  recentInsights: VoiceInterfaceInsight[] | undefined,
  fallbackProfile: string | null | undefined,
  serverContext: VoiceServerContext,
): string {
  const profileText = serverContext.internal_profile ?? fallbackProfile ?? null;

  const basePrompt = buildVoicePrompt(
    userContext,
    undefined,
    recentInsights,
    profileText,
  );

  return enrichVoicePrompt(basePrompt, {
    clinicalContext: serverContext.clinical_context,
    approachGuidance: serverContext.approach_guidance,
    memorySection: profileText,
  });
}

export interface VoiceInterfaceInsight {
  insight_type: string;
  title: string;
  description: string;
}

export function createVoiceContextRefresher(
  sendContextualUpdate: ((text: string) => void) | undefined,
) {
  let requestId = 0;

  return async function refreshVoiceClinicalContext(
    messages: VoiceChatMessage[],
  ): Promise<void> {
    if (!sendContextualUpdate) return;

    const currentRequest = ++requestId;

    try {
      const serverContext = await fetchVoiceServerContext(messages, 'context');
      if (currentRequest !== requestId) return;

      const update = formatTurnContextualUpdate(serverContext);
      if (update) {
        sendContextualUpdate(update);
      }
    } catch (err) {
      console.warn('[voice] clinical context refresh failed:', err);
    }
  };
}

export function cloneVoiceMessages(
  messages?: VoiceChatMessage[],
): VoiceChatMessage[] {
  return (messages ?? []).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}
