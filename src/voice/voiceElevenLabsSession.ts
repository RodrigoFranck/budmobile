import type { BaseSessionConfig } from '@elevenlabs/client';

import type { UserContext } from '@/voice/voicePrompt';

type VoiceSessionClientData = Pick<
  BaseSessionConfig,
  'overrides' | 'dynamicVariables' | 'userId'
>;

export type VoiceSessionStartOptions =
  | (VoiceSessionClientData & { conversationToken: string; signedUrl?: undefined })
  | (VoiceSessionClientData & { signedUrl: string; conversationToken?: undefined });

export function buildVoiceDynamicVariables(
  userContext?: UserContext,
): Record<string, string | number | boolean> {
  return {
    name: userContext?.name ?? 'amigo',
    age: userContext?.age ?? 'não informado',
    gender: userContext?.gender ?? 'não informado',
    occupation: userContext?.occupation ?? 'não informado',
    relationship: userContext?.relationship ?? 'não informado',
    hobbies: userContext?.hobbies?.join(', ') ?? 'não informado',
    conversationGoal: userContext?.conversationGoal ?? 'não informado',
    initialThoughts: userContext?.initialThoughts ?? 'não informado',
    isFirstInteractionOfDay: userContext?.isFirstInteractionOfDay ? 'Sim' : 'Não',
  };
}

function buildVoiceSessionClientData(params: {
  prompt: string;
  userId?: string | null;
  userContext?: UserContext;
}): VoiceSessionClientData {
  return {
    overrides: {
      agent: {
        prompt: {
          prompt: params.prompt,
        },
      },
    },
    dynamicVariables: buildVoiceDynamicVariables(params.userContext),
    ...(params.userId ? { userId: params.userId } : {}),
  };
}

export function buildVoiceSessionStartOptions(params: {
  prompt: string;
  userId?: string | null;
  userContext?: UserContext;
  conversationToken?: string;
  signedUrl?: string;
}): VoiceSessionStartOptions {
  const clientData = buildVoiceSessionClientData(params);

  if (params.conversationToken) {
    return {
      ...clientData,
      conversationToken: params.conversationToken,
    };
  }

  if (params.signedUrl) {
    return {
      ...clientData,
      signedUrl: params.signedUrl,
    };
  }

  throw new Error('conversationToken or signedUrl is required');
}
