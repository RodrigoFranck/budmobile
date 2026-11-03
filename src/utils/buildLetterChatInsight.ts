import type { ChatInsightParam } from '@/types/chatInsight';

export const DAILY_LETTER_INSIGHT_TYPE = 'daily_letter';

export function buildLetterChatInsight(params: {
  letterId?: string | null;
  title: string;
  shareText: string;
  opening: string;
}): ChatInsightParam {
  const title = params.title.trim();
  const opening = params.opening.trim();
  const shareText = params.shareText.trim();
  const letterId = params.letterId?.trim();

  const internalParts = [
    'A pessoa tocou em Conversar sobre isso a partir da carta do dia.',
    'conversa.origem = carta',
    letterId ? `carta_id: ${letterId}` : null,
    'Texto da carta:',
    shareText || title,
  ].filter((part): part is string => Boolean(part));

  return {
    insightType: DAILY_LETTER_INSIGHT_TYPE,
    badge: 'CARTA DE HOJE',
    title: title || 'Carta de hoje',
    contextSummary: opening || title || 'Carta de hoje',
    internalContext: internalParts.join('\n\n'),
    cardDescription: opening || title || 'Carta de hoje',
    backgroundType: 'yesterday',
    contextVariant: 'letter',
    initialUserMessage: title
      ? `Quero conversar sobre a carta de hoje: "${title}".`
      : 'Quero conversar sobre a carta de hoje.',
  };
}
