import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { ChatTabParams } from '@/utils/navigateToChat';
import {
  clearPendingChatInsight,
  navigateToChatTab,
  stashPendingChatInsight,
} from '@/utils/navigateToChat';

type StackLikeNavigation = NavigationProp<ParamListBase> & {
  navigate: (name: string, params?: object) => void;
  goBack?: () => void;
};

function findNavigatorWithRoute(
  navigation: NavigationProp<ParamListBase>,
  routeName: string,
): NavigationProp<ParamListBase> | null {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const routeNames = current.getState?.()?.routeNames ?? [];
    if (routeNames.includes(routeName)) return current;
    current = current.getParent?.() as NavigationProp<ParamListBase> | undefined;
  }
  return null;
}

/**
 * TF-112 · Shortcuts that open chat WITH context are Premium from day 1.
 * Free → monthly paywall; after subscribe, pending insight is consumed on Chat focus.
 * Closing paywall (X) returns to the previous screen.
 */
export function openContextualChatOrPaywall(
  navigation: NavigationProp<ParamListBase>,
  params: ChatTabParams,
  options: { requiresPremiumForContext: boolean },
) {
  if (!options.requiresPremiumForContext) {
    navigateToChatTab(navigation, params);
    return;
  }

  if (params.chatInsight) {
    stashPendingChatInsight(params.chatInsight);
  }

  const tabNav = findNavigatorWithRoute(navigation, 'Paywall');
  if (tabNav) {
    (tabNav as StackLikeNavigation).navigate('Paywall', {
      interval: 'monthly',
      resumePendingChatInsight: true,
    });
    return;
  }

  (navigation as StackLikeNavigation).navigate('Paywall', {
    interval: 'monthly',
    resumePendingChatInsight: true,
  });
}

export function discardPendingContextualChat() {
  clearPendingChatInsight();
}
