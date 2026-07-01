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

function buildExploreInitialUserMessage(insightType: string, insight: Insight): string {
  const title = insight.title.trim();

  if (insightType === 'yesterday_journey') {
    return title
      ? `Quero continuar nossa conversa de ontem sobre "${title}".`
      : 'Quero continuar nossa conversa de ontem.';
  }

  if (insightType === 'habit') {
    return title
      ? `Quero trabalhar no hábito: "${title}".`
      : 'Quero trabalhar nesse hábito.';
  }

  return title
    ? `Quero conversar sobre "${title}".`
    : DEFAULT_EXPLORE_START_MESSAGE;
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

  return {
    insightType,
    badge: config.badge,
    title: insight.title,
    contextSummary: insight.contextSummary ?? insight.title,
    internalContext: insight.internalContext ?? insight.description,
    cardDescription: insight.description,
    backgroundType: config.backgroundType,
    ...(insight.conversationId ? { conversationId: insight.conversationId } : {}),
    ...(mode === 'text'
      ? { initialUserMessage: buildExploreInitialUserMessage(insightType, insight) }
      : { autoStartVoice: true }),
  };
}
