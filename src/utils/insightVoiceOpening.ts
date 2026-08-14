import type { ChatInsightParam } from '@/types/chatInsight';

export function buildInsightVoiceFirstMessage(
  insight: Pick<ChatInsightParam, 'insightType' | 'title'>,
): string {
  const insightType = insight.insightType?.trim() ?? '';

  if (insightType === 'habit') {
    return 'Por onde você quer começar nisso hoje?';
  }

  if (insightType.startsWith('checkin_')) {
    return 'Por onde entramos nisso?';
  }

  if (insightType === 'frequency') {
    return 'Quer olhar isso comigo agora?';
  }

  return 'Por onde entramos hoje?';
}
