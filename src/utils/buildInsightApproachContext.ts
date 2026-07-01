import type { ApproachContext } from '@/utils/chatStream';
import type { InsightContext } from '@/utils/chatStream';

export function buildInsightApproachContext(
  insight: InsightContext,
): ApproachContext {
  const topic = insight.title?.trim() || insight.contextSummary?.trim() || 'insight';

  return {
    strategy: 'balanced_exploration',
    guidanceText:
      `ORIENTAÇÃO INTERNA: o usuário abriu o chat pelo insight "${topic}"` +
      `${insight.insightType ? ` (${insight.insightType})` : ''}. ` +
      'Use o insight ativo no system prompt como tema central. Responda diretamente sobre esse insight — não peça para especificar o assunto.',
  };
}
