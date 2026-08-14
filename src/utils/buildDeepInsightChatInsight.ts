import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { DeepInsight } from '@/hooks/useDeepInsight';
import type { ChatInsightParam } from '@/types/chatInsight';
import { navigateToChatTab } from '@/utils/navigateToChat';

const DEFAULT_DEEP_INSIGHT_START_MESSAGE = 'Quero conversar sobre o insight da semana.';
const DEEP_INSIGHT_BADGE = 'INSPIRADO EM VOCÊ';

export type DeepInsightChatMode = 'text' | 'voice';

function formatSection(
  section: DeepInsight['what_i_noticed'] | undefined,
): string | null {
  const title = section?.title?.trim();
  const content = section?.content?.trim();
  if (!title && !content) {
    return null;
  }
  if (title && content) {
    return `${title}: ${content}`;
  }
  return title || content || null;
}

function formatDeepInsightInternalContext(insight: DeepInsight): string {
  const sections = [
    insight.headline.trim() ? `Headline: ${insight.headline.trim()}` : null,
    insight.intro.trim() ? `Introdução: ${insight.intro.trim()}` : null,
    formatSection(insight.what_i_noticed),
    formatSection(insight.reflection),
    formatSection(insight.key_takeaway),
    formatSection(insight.next_steps),
  ].filter((section): section is string => Boolean(section));

  return sections.join('\n\n');
}

function resolveDeepInsightContent(insight: DeepInsight): string {
  return (
    insight.intro.trim() ||
    insight.key_takeaway?.content?.trim() ||
    insight.headline.trim()
  );
}

function buildDeepInsightInitialUserMessage(insight: DeepInsight): string {
  const content = resolveDeepInsightContent(insight);
  if (!content) {
    return DEFAULT_DEEP_INSIGHT_START_MESSAGE;
  }

  return `Quero conversar sobre isso: ${content}`;
}

export function buildDeepInsightChatInsight(
  insight: DeepInsight,
  mode: DeepInsightChatMode = 'text',
): ChatInsightParam {
  const content = resolveDeepInsightContent(insight);
  const title = insight.headline.trim() || 'Inspirado em você';
  const internalContext = formatDeepInsightInternalContext(insight);

  return {
    insightType: 'deep_insight',
    badge: DEEP_INSIGHT_BADGE,
    title,
    contextSummary: content || title,
    internalContext: internalContext || content || title,
    cardDescription: content || title,
    backgroundType: 'inspired',
    initialUserMessage: buildDeepInsightInitialUserMessage(insight),
    autoStartVoice: mode === 'voice',
  };
}

export function openDeepInsightChat(
  navigation: NavigationProp<ParamListBase>,
  insight: DeepInsight,
  mode: DeepInsightChatMode = 'text',
) {
  navigateToChatTab(navigation, {
    chatInsight: buildDeepInsightChatInsight(insight, mode),
  });
}
