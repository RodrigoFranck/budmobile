import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { CheckinReport, CheckinType } from '@/hooks/useCheckIns';
import type { ChatInsightParam } from '@/types/chatInsight';
import { navigateToChatTab } from '@/utils/navigateToChat';

interface BuildCheckInChatInsightParams {
  type: CheckinType;
  report: CheckinReport;
  responses?: Record<string, unknown> | null;
  clickedQuestion?: string;
  mode?: 'text' | 'voice';
}

function getCheckInMeta(type: CheckinType): {
  badge: string;
  checkinLabel: string;
  backgroundType: NonNullable<ChatInsightParam['backgroundType']>;
} {
  if (type === 'morning') {
    return {
      badge: 'CHECK-IN MANHÃ',
      checkinLabel: 'Check-in da Manhã',
      backgroundType: 'inspired',
    };
  }
  if (type === 'post_game') {
    return {
      badge: 'CHECK-IN PÓS-JOGO',
      checkinLabel: 'Check-in Pós-Jogo',
      backgroundType: 'habit',
    };
  }
  return {
    badge: 'CHECK-IN PÓS-TREINO',
    checkinLabel: 'Check-in Pós-Treino',
    backgroundType: 'habit',
  };
}

export function buildCheckInChatInsight({
  type,
  report,
  responses = null,
  clickedQuestion,
  mode = 'text',
}: BuildCheckInChatInsightParams): ChatInsightParam {
  const { badge, checkinLabel, backgroundType } = getCheckInMeta(type);
  const reflectionTopic = clickedQuestion?.trim();

  const richContext = {
    checkin_type: type,
    checkin_label: checkinLabel,
    headline: report.headline,
    analysis: report.analysis,
    reflection_questions: report.reflection_questions ?? [],
    user_responses: responses,
    clicked_question: reflectionTopic ?? null,
  };

  const userMessage =
    reflectionTopic ||
    (report.analysis.trim()
      ? `Quero conversar sobre isso: ${report.analysis.trim()}`
      : 'Quero conversar sobre o que surgiu no meu check-in de hoje.');
  const content = reflectionTopic || report.analysis.trim() || report.headline;

  return {
    insightType: `checkin_${type}`,
    badge,
    title: reflectionTopic || report.headline,
    contextSummary: content,
    internalContext: JSON.stringify(richContext),
    cardDescription: content,
    backgroundType,
    initialUserMessage: userMessage,
    autoStartVoice: mode === 'voice',
  };
}

export function openCheckInChat(
  navigation: NavigationProp<ParamListBase>,
  options: BuildCheckInChatInsightParams,
) {
  const chatInsight = buildCheckInChatInsight(options);
  navigateToChatTab(navigation, { chatInsight });
}
