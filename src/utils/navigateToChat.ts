import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { MainTabParamList } from '@/types/navigation';
import type { ChatInsightParam } from '@/types/chatInsight';

export type ChatTabParams = NonNullable<MainTabParamList['Chat']>;

function findTabNavigator(navigation: NavigationProp<ParamListBase>): NavigationProp<ParamListBase> {
  let current: NavigationProp<ParamListBase> | undefined = navigation;

  while (current) {
    const routeNames = current.getState?.()?.routeNames ?? [];
    if (routeNames.includes('Chat') && routeNames.includes('Explore')) {
      return current;
    }
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }

  return navigation;
}

let pendingChatInsight: ChatInsightParam | null = null;
let chatInsightConsumer: ((insight: ChatInsightParam) => void) | null = null;

/** Fallback se os params da rota não chegarem ao focar o Chat (navegação aninhada). */
export function stashPendingChatInsight(insight: ChatInsightParam) {
  pendingChatInsight = insight;
}

export function takePendingChatInsight(): ChatInsightParam | null {
  const insight = pendingChatInsight;
  pendingChatInsight = null;
  return insight;
}

export function clearPendingChatInsight() {
  pendingChatInsight = null;
}

export function registerChatInsightConsumer(
  consumer: ((insight: ChatInsightParam) => void) | null,
) {
  chatInsightConsumer = consumer;
}

export function consumePendingChatInsight() {
  const insight = takePendingChatInsight();
  if (!insight) return;
  chatInsightConsumer?.(insight);
}

export function navigateToChatTab(
  navigation: NavigationProp<ParamListBase>,
  params: ChatTabParams,
) {
  if (params.chatInsight) {
    if (chatInsightConsumer) {
      chatInsightConsumer(params.chatInsight);
    } else {
      stashPendingChatInsight(params.chatInsight);
    }
  }

  const tabNav = findTabNavigator(navigation);
  tabNav.navigate('Chat', {
    ...params,
    screen: 'TextChat',
  });
}
