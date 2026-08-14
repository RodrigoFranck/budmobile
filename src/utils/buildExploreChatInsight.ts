import type { Insight } from '@/hooks/useExploreInsights';
import type { ChatInsightParam } from '@/types/chatInsight';

const EXPLORE_INSIGHT_CONFIG: Record<
  string,
  Pick<ChatInsightParam, 'badge' | 'backgroundType'>
> = {
  yesterday_journey: {
    badge: 'SUA JORNADA DE ONTEM',
    backgroundType: 'yesterday',
  },
  general_insight: {
    badge: 'INSPIRADO EM VOCÊ',
    backgroundType: 'inspired',
  },
  frequency: {
    badge: 'SUA FREQUÊNCIA',
    backgroundType: 'frequency',
  },
  habit: {
    badge: 'CONSTRUA UM HÁBITO',
    backgroundType: 'habit',
  },
};

const DEFAULT_EXPLORE_START_MESSAGE = 'Quero conversar sobre esse insight.';

function resolveExploreInsightContent(insight: Insight): string {
  return (
    insight.description.trim() ||
    insight.contextSummary?.trim() ||
    insight.title.trim()
  );
}

function buildExploreInitialUserMessage(insightType: string, insight: Insight): string {
  const content = resolveExploreInsightContent(insight);

  if (!content) {
    return DEFAULT_EXPLORE_START_MESSAGE;
  }

  if (insightType === 'yesterday_journey') {
    return `Quero continuar nossa conversa de ontem a partir disso: ${content}`;
  }

  if (insightType === 'habit') {
    return `Quero trabalhar nesse hábito a partir disso: ${content}`;
  }

  return `Quero conversar sobre isso: ${content}`;
}

export type ExploreChatMode = 'text' | 'voice';

export function buildExploreChatInsight(
  insightType: string,
  insight: Insight,
  mode: ExploreChatMode = 'text',
): ChatInsightParam {
  const config = EXPLORE_INSIGHT_CONFIG[insightType] ?? {
    badge: 'INSIGHT',
    backgroundType: 'inspired' as const,
  };
  const content = resolveExploreInsightContent(insight);

  return {
    insightType,
    badge: config.badge,
    title: insight.title,
    contextSummary: content,
    internalContext: insight.internalContext ?? insight.description,
    cardDescription: content,
    backgroundType: config.backgroundType,
    ...(insight.conversationId ? { conversationId: insight.conversationId } : {}),
    ...(mode === 'voice' ? { autoStartVoice: true } : {}),
    initialUserMessage: buildExploreInitialUserMessage(insightType, insight),
  };
}
