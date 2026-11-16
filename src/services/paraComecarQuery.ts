import { supabase } from '@/integrations/supabase/client';

export type ParaComecarCard = {
  conversation_id: string;
  fragmento: string;
  paragrafo: string;
  mensagem_id: string;
  autor?: 'pessoa';
  tema?: string | null;
  data_fala?: string | null;
  fonte?: string;
};

function asCard(value: unknown): ParaComecarCard | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ParaComecarCard>;
  if (
    typeof row.conversation_id !== 'string' ||
    typeof row.fragmento !== 'string' ||
    typeof row.paragrafo !== 'string' ||
    typeof row.mensagem_id !== 'string'
  ) {
    return null;
  }
  const fragmento = row.fragmento.trim();
  const paragrafo = row.paragrafo.trim();
  if (!fragmento || !paragrafo || !row.conversation_id || !row.mensagem_id) return null;
  return {
    conversation_id: row.conversation_id,
    fragmento,
    paragrafo,
    mensagem_id: row.mensagem_id,
    autor: 'pessoa',
    tema: typeof row.tema === 'string' ? row.tema : null,
    data_fala: typeof row.data_fala === 'string' ? row.data_fala : null,
    fonte: typeof row.fonte === 'string' ? row.fonte : undefined,
  };
}

/** TF-67 / TF-59 · pede cards com parágrafo próprio ancorado em mensagem da pessoa. */
export async function requestParaComecarCards(params: {
  conversationIds: string[];
  knownBodies?: string[];
}): Promise<ParaComecarCard[]> {
  const conversationIds = params.conversationIds.filter(Boolean).slice(0, 6);
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase.functions.invoke('generate-para-comecar', {
    body: {
      conversation_ids: conversationIds,
      known_bodies: params.knownBodies ?? [],
    },
  });

  if (error) {
    console.warn('generate-para-comecar failed:', error.message);
    return [];
  }

  const cards = (data as { cards?: unknown } | null)?.cards;
  if (!Array.isArray(cards)) return [];
  return cards.flatMap((card) => {
    const parsed = asCard(card);
    return parsed ? [parsed] : [];
  });
}
