import type { ApproachContext } from '@/utils/chatStream';
import type { InsightContext } from '@/utils/chatStream';

const EXPLORE_INSIGHT_TYPES = new Set([
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
]);

function resolveInsightTopic(insight: InsightContext, insightType: string): string {
  if (insightType === 'deep_insight') {
    return (
      insight.internalContext?.trim() ||
      insight.contextSummary?.trim() ||
      insight.cardDescription?.trim() ||
      insight.title?.trim() ||
      'insight semanal'
    );
  }

  return (
    insight.cardDescription?.trim() ||
    insight.contextSummary?.trim() ||
    insight.title?.trim() ||
    'insight'
  );
}

function resolveInsightGuidance(insightType: string): string {
  if (insightType === 'deep_insight') {
    return ' O contexto interno traz o insight semanal completo (o que você notou, a reflexão, o takeaway e os próximos passos). Use esse CONTEÚDO para retomar o tema com naturalidade. Não peça para especificar o assunto e não se limite ao título do card.';
  }

  if (EXPLORE_INSIGHT_TYPES.has(insightType)) {
    return ' O contexto interno traz análise e trechos das conversas usadas para gerar esse card do Explorar — use o CONTEÚDO do insight (não só o título) para retomar o tema com naturalidade. Não peça para especificar o assunto.';
  }

  return ' Use o conteúdo do insight ativo no system prompt como tema central. Responda a partir desse conteúdo — não peça para especificar o assunto e não se limite ao título.';
}

export function buildInsightApproachContext(
  insight: InsightContext,
): ApproachContext {
  const insightType = insight.insightType?.trim() ?? '';
  const topic = resolveInsightTopic(insight, insightType);

  return {
    strategy: 'balanced_exploration',
    guidanceText:
      `ORIENTAÇÃO INTERNA: o usuário abriu o chat a partir deste insight (${insightType || 'insight'}):\n${topic}` +
      resolveInsightGuidance(insightType),
  };
}
