import { CommonActions } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { MainTabParamList } from '@/types/navigation';
import type { ChatInsightParam } from '@/types/chatInsight';

export type ChatTabParams = NonNullable<MainTabParamList['Chat']>;

let pendingChatInsight: ChatInsightParam | null = null;

/** Fallback se os params da rota não chegarem ao focar o Chat (navegação aninhada). */
export function stashPendingChatInsight(insight: ChatInsightParam) {
  pendingChatInsight = insight;
}

export function takePendingChatInsight(): ChatInsightParam | null {
  const insight = pendingChatInsight;
  pendingChatInsight = null;
  return insight;
}

export function navigateToChatTab(
  navigation: NavigationProp<ParamListBase>,
  params: ChatTabParams,
) {
  if (params.chatInsight) {
    stashPendingChatInsight(params.chatInsight);
  }

  const tabNav = navigation.getParent();
  if (tabNav) {
    tabNav.navigate('Chat', params);
    return;
  }

  navigation.dispatch(
    CommonActions.navigate({
      name: 'Chat',
      params,
    }),
  );
}
