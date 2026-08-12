import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { MainTabParamList } from '@/types/navigation';
import type { ChatInsightParam } from '@/types/chatInsight';

export type ChatTabParams = NonNullable<MainTabParamList['Chat']>;

function findNavigatorWithRoutes(
  navigation: NavigationProp<ParamListBase>,
  requiredRoutes: string[],
): NavigationProp<ParamListBase> | null {
  let current: NavigationProp<ParamListBase> | undefined = navigation;

  while (current) {
    const routeNames = current.getState?.()?.routeNames ?? [];
    if (requiredRoutes.every((route) => routeNames.includes(route))) {
      return current;
    }
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }

  return null;
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

  const chatParams = {
    ...params,
    screen: 'TextChat' as const,
  };

  // Within MainTabs (Explore, Activities, History, Chat).
  const tabNav = findNavigatorWithRoutes(navigation, ['Chat', 'Explore']);
  if (tabNav) {
    tabNav.navigate('Chat', chatParams);
    return;
  }

  // Outside MainTabs (e.g. CheckIn on the root stack) — pop back into tabs.
  const rootNav = findNavigatorWithRoutes(navigation, ['MainTabs']);
  if (rootNav) {
    rootNav.navigate('MainTabs', {
      screen: 'Chat',
      params: chatParams,
    });
    return;
  }

  navigation.navigate('Chat' as never, chatParams as never);
}
