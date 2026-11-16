import {
  enforceGeneratedGender,
  genderAddressInstruction,
  genderDeepStrings,
  genderVoiceFrom,
  grammaticalGenderFrom,
  lintGeneratedGender,
  type GrammaticalVoice,
} from '@/copy/genderedCopy';
import { supabase } from '@/integrations/supabase/client';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';

export type ActivitySynthesis = {
  titulo: string;
  paragrafo: string;
  perguntas_mais_fundo: [string, string, string];
};

export type PorquesPair = {
  pergunta: string;
  resposta: string;
};

export type PorquesQuestionResult = {
  pergunta: string;
  mesma_camada?: boolean;
  risco?: boolean;
  opcoes?: [string, string];
};

export type GeneratedValueCard = {
  title: string;
  body: string;
  origem: 'ia';
};

export type FieeValence = -1 | 0 | 1;

async function invokeJson<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  try {
    const { data, error, response } = await supabase.functions.invoke(name, { body });
    if (error || !data) {
      const responseBody = response ? await response.text().catch(() => null) : null;
      console.error(`${name} failed`, {
        status: response?.status,
        body: responseBody,
        error: error?.message,
      });
      return null;
    }
    return data as T;
  } catch (error) {
    console.error(`${name} failed`, {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

function genderPayload(gender?: string | null) {
  const voice = genderVoiceFrom(gender);
  return {
    voice,
    genero_gramatical: grammaticalGenderFrom(gender),
    gender_instruction: genderAddressInstruction(voice),
    user_gender: gender ?? null,
  };
}

function normalizeSynthesis(
  data: ActivitySynthesis,
  voice: GrammaticalVoice,
): ActivitySynthesis {
  const titulo = enforceGeneratedGender(data.titulo, voice);
  const paragrafo = enforceGeneratedGender(data.paragrafo, voice);
  const perguntas = data.perguntas_mais_fundo.map((item) =>
    enforceGeneratedGender(item, voice),
  ) as [string, string, string];
  return { titulo, paragrafo, perguntas_mais_fundo: perguntas };
}

function synthesisNeedsRetry(data: ActivitySynthesis, voice: GrammaticalVoice) {
  const parts = [data.titulo, data.paragrafo, ...data.perguntas_mais_fundo];
  return parts.some((part) => !lintGeneratedGender(part, voice).ok);
}

export async function generatePorquesQuestion(params: {
  tema_inicial: string;
  pares: PorquesPair[];
  camada: number;
  resposta_atual?: string;
  pedir_ajuda?: boolean;
  gender?: string | null;
}): Promise<PorquesQuestionResult | null> {
  const { voice, ...genderFields } = genderPayload(params.gender);
  const data = await invokeJson<PorquesQuestionResult>('generate-porques-question', {
    tema_inicial: params.tema_inicial,
    pares: params.pares,
    camada: params.camada,
    resposta_atual: params.resposta_atual,
    pedir_ajuda: params.pedir_ajuda,
    ...genderFields,
  });
  if (!data) return null;
  const opcoes = Array.isArray(data.opcoes)
    ? data.opcoes
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => enforceGeneratedGender(item.trim(), voice))
        .slice(0, 2)
    : [];
  return {
    pergunta:
      typeof data.pergunta === 'string'
        ? enforceGeneratedGender(data.pergunta, voice)
        : '',
    mesma_camada: Boolean(data.mesma_camada),
    risco: Boolean(data.risco),
    opcoes: opcoes.length === 2 ? [opcoes[0], opcoes[1]] : undefined,
  };
}

export async function generateActivitySynthesis(params: {
  activityId: ActivityId;
  answers: Record<string, unknown>;
  userName?: string | null;
  gender?: string | null;
}): Promise<ActivitySynthesis | null> {
  const { voice, ...genderFields } = genderPayload(params.gender);
  const answers = genderDeepStrings(params.answers, voice);

  const requestBody = {
    activity_type: params.activityId,
    answers,
    user_name: params.userName ?? null,
    ...genderFields,
  };

  const parse = (data: ActivitySynthesis | null): ActivitySynthesis | null => {
    if (!data?.titulo || !data?.paragrafo || !Array.isArray(data.perguntas_mais_fundo)) {
      return null;
    }
    const perguntas = data.perguntas_mais_fundo
      .filter((item): item is string => typeof item === 'string')
      .slice(0, 3);
    if (perguntas.length < 3) return null;
    return {
      titulo: data.titulo,
      paragrafo: data.paragrafo,
      perguntas_mais_fundo: [perguntas[0], perguntas[1], perguntas[2]],
    };
  };

  let parsed = parse(await invokeJson<ActivitySynthesis>('generate-activity-synthesis', requestBody));
  if (!parsed) return null;

  if (synthesisNeedsRetry(parsed, voice)) {
    const retried = parse(
      await invokeJson<ActivitySynthesis>('generate-activity-synthesis', requestBody),
    );
    if (retried) parsed = retried;
  }

  return normalizeSynthesis(parsed, voice);
}

export async function generateValoresCards(params: {
  contexto: Record<string, unknown>;
  gender?: string | null;
}): Promise<GeneratedValueCard[]> {
  const { voice, ...genderFields } = genderPayload(params.gender);
  const data = await invokeJson<{ cartas?: GeneratedValueCard[] }>('generate-valores-cards', {
    contexto: genderDeepStrings(params.contexto, voice),
    ...genderFields,
  });
  if (!data?.cartas?.length) return [];
  return data.cartas
    .filter((card) => card?.title && card?.body)
    .slice(0, 4)
    .map((card) => ({
      title: enforceGeneratedGender(card.title.trim(), voice),
      body: enforceGeneratedGender(card.body.trim(), voice),
      origem: 'ia' as const,
    }));
}

export async function classifyFieeWord(palavra: string): Promise<{
  valencia: FieeValence;
} | null> {
  const data = await invokeJson<{ valencia?: number }>('generate-activity-synthesis', {
    activity_type: 'fiee_classify',
    answers: { palavra },
  });
  if (typeof data?.valencia !== 'number') {
    return { valencia: 0 };
  }
  const valencia: FieeValence = data.valencia <= -1 ? -1 : data.valencia >= 1 ? 1 : 0;
  return { valencia };
}
