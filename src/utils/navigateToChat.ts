import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { MainTabParamList } from '@/types/navigation';
import type { ChatInsightParam } from '@/types/chatInsight';

export type ChatTabParams = NonNullable<MainTabParamList['Chat']>;

type StackLikeNavigation = NavigationProp<ParamListBase> & {
  popTo?: (name: string, params?: object) => void;
  navigate: (
    name: string,
    params?: object,
    options?: { merge?: boolean; pop?: boolean },
  ) => void;
};

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

function buildChatScreenParams(params: ChatTabParams): ChatTabParams {
  return {
    ...params,
    screen: 'TextChat',
    params: params.chatInsight?.autoStartVoice
      ? { autoStartVoice: true }
      : params.params,
  };
}

function popToMainTabsChat(
  rootNav: NavigationProp<ParamListBase>,
  chatParams: ChatTabParams,
) {
  const nested = {
    screen: 'Chat' as const,
    params: chatParams,
  };
  const nav = rootNav as StackLikeNavigation;

  if (typeof nav.popTo === 'function') {
    nav.popTo('MainTabs', nested);
    return;
  }

  nav.navigate('MainTabs', nested, { pop: true });
}

export function navigateToChatTab(
  navigation: NavigationProp<ParamListBase>,
  params: ChatTabParams,
) {
  if (params.chatInsight) {
    stashPendingChatInsight(params.chatInsight);
  }

  const chatParams = buildChatScreenParams(params);

  // Within MainTabs (Explore, Activities, History, Chat).
  const tabNav = findNavigatorWithRoutes(navigation, ['Chat', 'Explore']);
  if (tabNav) {
    tabNav.navigate('Chat', chatParams);
    return;
  }

  // Outside MainTabs (e.g. CheckIn on the root stack) — pop back into tabs.
  // React Navigation 7 `navigate` pushes a new screen instead of returning to
  // MainTabs, so we must popTo / { pop: true } or the insight never lands on Chat.
  const rootNav = findNavigatorWithRoutes(navigation, ['MainTabs']);
  if (rootNav) {
    popToMainTabsChat(rootNav, chatParams);
    return;
  }

  navigation.navigate('Chat' as never, chatParams as never);
}
