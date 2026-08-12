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
  const topic = insight.title?.trim() || insight.contextSummary?.trim() || 'insight';
  const insightType = insight.insightType?.trim() ?? '';
  const fromExplore = EXPLORE_INSIGHT_TYPES.has(insightType);

  const exploreGuidance = fromExplore
    ? ' O contexto interno traz análise e trechos das conversas usadas para gerar esse card do Explorar — use-os para retomar o tema com naturalidade. Não peça para especificar o assunto.'
    : ' Use o insight ativo no system prompt como tema central. Responda diretamente sobre esse insight — não peça para especificar o assunto.';

  return {
    strategy: 'balanced_exploration',
    guidanceText:
      `ORIENTAÇÃO INTERNA: o usuário abriu o chat pelo insight "${topic}"` +
      `${insightType ? ` (${insightType})` : ''}.` +
      exploreGuidance,
  };
}
