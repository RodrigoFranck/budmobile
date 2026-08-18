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
      `ORIENTAÇÃO INTERNA: o usuário abriu o chat a partir de um insight${insightType ? ` (${insightType})` : ''}.` +
      resolveInsightGuidance(insightType),
  };
}
