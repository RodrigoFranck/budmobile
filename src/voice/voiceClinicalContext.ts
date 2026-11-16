import { supabase } from '@/integrations/supabase/client';
import {
  buildBudSystemPrompt,
  PROMPT_VERSION,
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
  system_prompt?: string | null;
  prompt_version?: string | null;
  token?: string | null;
  signed_url?: string | null;
}

export interface VoicePromptExtras {
  userContext?: UserContext;
  recentInsights?: VoiceInterfaceInsight[];
  internalProfile?: string | null;
  approachGuidance?: string | null;
  insightContext?: {
    insightType?: string;
    internalContext?: string;
  };
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
  extras?: VoicePromptExtras,
): Promise<VoiceServerContext> {
  const { data, error, response } = await supabase.functions.invoke('chat-voice', {
    body: {
      messages,
      mode,
      userContext: extras?.userContext,
      insightContext: extras?.insightContext,
      recentInsights: extras?.recentInsights,
      internalProfile: extras?.internalProfile ?? null,
      approachGuidance: extras?.approachGuidance ?? null,
    },
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
  const serverPrompt = serverContext.system_prompt?.trim();
  if (serverPrompt) {
    const version = serverContext.prompt_version?.trim() || PROMPT_VERSION;
    console.log(`[prompt] version=${version} source=voice-server`);
    return serverPrompt;
  }

  const profileText = serverContext.internal_profile ?? fallbackProfile ?? null;
  let insightContext: VoicePromptExtras['insightContext'];
  if (recentInsights && recentInsights.length > 0) {
    insightContext = {
      insightType: recentInsights[0].insight_type,
      internalContext: recentInsights[0].description,
    };
  }

  const { prompt, promptVersion } = buildBudSystemPrompt({
    userContext,
    insightContext,
    memorySection: profileText,
    approachGuidance: serverContext.approach_guidance,
    clinicalContext: serverContext.clinical_context,
    includeVoiceTts: true,
  });
  console.log(`[prompt] version=${promptVersion} source=voice-client-fallback`);
  return prompt;
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
