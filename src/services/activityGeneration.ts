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
}

export async function generatePorquesQuestion(params: {
  tema_inicial: string;
  pares: PorquesPair[];
  camada: number;
  resposta_atual?: string;
  pedir_ajuda?: boolean;
}): Promise<PorquesQuestionResult | null> {
  const data = await invokeJson<PorquesQuestionResult>('generate-porques-question', params);
  if (!data) return null;
  const opcoes = Array.isArray(data.opcoes)
    ? data.opcoes
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, 2)
    : [];
  return {
    pergunta: typeof data.pergunta === 'string' ? data.pergunta : '',
    mesma_camada: Boolean(data.mesma_camada),
    risco: Boolean(data.risco),
    opcoes: opcoes.length === 2 ? [opcoes[0], opcoes[1]] : undefined,
  };
}

export async function generateActivitySynthesis(params: {
  activityId: ActivityId;
  answers: Record<string, unknown>;
  userName?: string | null;
}): Promise<ActivitySynthesis | null> {
  const data = await invokeJson<ActivitySynthesis>('generate-activity-synthesis', {
    activity_type: params.activityId,
    answers: params.answers,
    user_name: params.userName ?? null,
  });
  if (!data?.titulo || !data?.paragrafo || !Array.isArray(data.perguntas_mais_fundo)) {
    return null;
  }
  const perguntas = data.perguntas_mais_fundo.filter((item) => typeof item === 'string').slice(0, 3);
  if (perguntas.length < 3) return null;
  return {
    titulo: data.titulo,
    paragrafo: data.paragrafo,
    perguntas_mais_fundo: [perguntas[0], perguntas[1], perguntas[2]],
  };
}

export async function generateValoresCards(params: {
  contexto: Record<string, unknown>;
}): Promise<GeneratedValueCard[]> {
  const data = await invokeJson<{ cartas?: GeneratedValueCard[] }>('generate-valores-cards', {
    contexto: params.contexto,
  });
  if (!data?.cartas?.length) return [];
  return data.cartas
    .filter((card) => card?.title && card?.body)
    .slice(0, 4)
    .map((card) => ({
      title: card.title.trim(),
      body: card.body.trim(),
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
