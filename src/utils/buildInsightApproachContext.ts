import type { ApproachContext } from '@/utils/chatStream';
import type { InsightContext } from '@/utils/chatStream';

const EXPLORE_INSIGHT_TYPES = new Set([
  'yesterday_journey',
  'general_insight',
  'frequency',
  'habit',
]);

export function buildInsightApproachContext(
  insight: InsightContext,
): ApproachContext {
  const topic =
    insight.cardDescription?.trim() ||
    insight.contextSummary?.trim() ||
    insight.title?.trim() ||
    'insight';
  const insightType = insight.insightType?.trim() ?? '';
  const fromExplore = EXPLORE_INSIGHT_TYPES.has(insightType);

  const exploreGuidance = fromExplore
    ? ' O contexto interno traz análise e trechos das conversas usadas para gerar esse card do Explorar — use o CONTEÚDO do insight (não só o título) para retomar o tema com naturalidade. Não peça para especificar o assunto.'
    : ' Use o conteúdo do insight ativo no system prompt como tema central. Responda a partir desse conteúdo — não peça para especificar o assunto e não se limite ao título.';

  return {
    strategy: 'balanced_exploration',
    guidanceText:
      `ORIENTAÇÃO INTERNA: o usuário abriu o chat a partir deste insight (${insightType || 'insight'}):\n${topic}` +
      exploreGuidance,
  };
}
