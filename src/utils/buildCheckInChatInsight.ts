import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { CheckinReport, CheckinType } from '@/hooks/useCheckIns';
import type { ChatInsightParam } from '@/types/chatInsight';
import { navigateToChatTab } from '@/utils/navigateToChat';

interface BuildCheckInChatInsightParams {
  type: CheckinType;
  report: CheckinReport;
  responses?: Record<string, unknown> | null;
  clickedQuestion?: string;
}

export function buildCheckInChatInsight({
  type,
  report,
  responses = null,
  clickedQuestion,
}: BuildCheckInChatInsightParams): ChatInsightParam {
  const badge = type === 'morning' ? 'CHECK-IN MANHÃ' : 'CHECK-IN PÓS-TREINO';
  const checkinLabel = type === 'morning' ? 'Check-in da Manhã' : 'Check-in Pós-Treino';

  const richContext = {
    checkin_type: type,
    checkin_label: checkinLabel,
    headline: report.headline,
    analysis: report.analysis,
    reflection_questions: report.reflection_questions ?? [],
    user_responses: responses,
    clicked_question: clickedQuestion ?? null,
  };

  const userMessage =
    clickedQuestion?.trim() ||
    'Quero conversar sobre o que surgiu no meu check-in de hoje.';

  return {
    insightType: 'checkin',
    badge,
    title: report.headline,
    contextSummary: clickedQuestion ?? report.analysis,
    internalContext: JSON.stringify(richContext),
    backgroundType: type === 'morning' ? 'inspired' : 'habit',
    initialUserMessage: userMessage,
  };
}

export function openCheckInChat(
  navigation: NavigationProp<ParamListBase>,
  options: BuildCheckInChatInsightParams,
) {
  const chatInsight = buildCheckInChatInsight(options);
  navigateToChatTab(navigation, { chatInsight });
}
