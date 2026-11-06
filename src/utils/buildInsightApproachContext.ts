import type { ApproachContext } from '@/utils/chatStream';
import type { InsightContext } from '@/utils/chatStream';

const EXPLORE_INSIGHT_TYPES = new Set([
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
]);

function resolveInsightGuidance(insightType: string): string {
  if (insightType === 'deep_insight') {
    return ' O contexto interno do system prompt traz o insight semanal completo. Use-o para retomar o tema. Não peça o assunto e não se limite ao título.';
  }

  if (insightType === 'yesterday_journey') {
    return ' O contexto interno traz a conversa de ONTEM. Retome só esse recorte. Não trate temas de outros dias da memória como se fossem ontem.';
  }

  if (insightType === 'daily_letter') {
    return ' O contexto interno traz a carta do dia completa (conversa.origem = carta). Retome o tema da carta na primeira fala. Não peça o assunto e não cumprimente de novo.';
  }

  if (insightType === 'conversation_recap') {
    return ' O contexto interno traz a conversa que a pessoa escolheu retomar no núcleo. Use esse recorte. Não peça o assunto.';
  }

  if (EXPLORE_INSIGHT_TYPES.has(insightType)) {
    return ' O contexto interno do system prompt traz análise e trechos das conversas do card. Use esse conteúdo (não o título) para retomar o tema. Não peça o assunto.';
  }

  if (insightType.startsWith('checkin_')) {
    return ' O contexto interno do system prompt traz o check-in (análise e respostas). Use esse conteúdo para retomar o tema. Não peça o assunto.';
  }

  return ' Use o contexto interno do system prompt como tema. Não peça o assunto e não se limite ao título.';
}

export function buildInsightApproachContext(
  insight: InsightContext,
): ApproachContext {
  const insightType = insight.insightType?.trim() ?? '';

  return {
    strategy: 'balanced_exploration',
    guidanceText:
      `ORIENTAÇÃO INTERNA: a pessoa abriu o chat a partir de um insight${insightType ? ` (${insightType})` : ''}.` +
      ' O texto do insight ativo é sobre a pessoa e ela escolheu conversar sobre isso; nunca responda como se fosse uma pergunta para você.' +
      ' Não diga "boa pergunta". Não comente os sentimentos do Bud. Fale da pessoa e do tema dela.' +
      ' Não há mensagem da pessoa nesta abertura — você abre a conversa no tema.' +
      resolveInsightGuidance(insightType),
  };
}
