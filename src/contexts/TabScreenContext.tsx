import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatMemoryContext } from '@/hooks/useChatMemoryContext';
import { useConversations } from '@/hooks/useConversations';
import { useExploreInsights } from '@/hooks/useExploreInsights';
import { useExploreViewedInsights } from '@/hooks/useExploreViewedInsights';
import { useMessages } from '@/hooks/useMessages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { clearPendingChatInsight } from '@/utils/navigateToChat';
import { prepareHistoryConversationTitles } from '@/utils/generateConversationTitle';
import type { MainTabParamList } from '@/types/navigation';
import type { Tables } from '@/integrations/supabase/types';
import type { ExploreInsightKey } from '@/constants/exploreInsights';

type Conversation = Tables<'conversations'>;

export type TabScreenName = keyof MainTabParamList;

interface TabScreenContextValue {
  isTabReady: (tab: TabScreenName) => boolean;
  chatHomeResetToken: number;
  resetChatToHome: () => void;
  chatConversationId: string | null;
  chatMessagesLoading: boolean;
  profileLoading: boolean;
  memoryLoading: boolean;
  conversationsLoading: boolean;
  insightsLoading: boolean;
  themeLoaded: boolean;
  chatConversationReady: boolean;
  conversations: Conversation[];
  refetchConversations: ReturnType<typeof useConversations>['refetch'];
  getOrCreateTodayConversation: ReturnType<
    typeof useConversations
  >['getOrCreateTodayConversation'];
  messages: ReturnType<typeof useMessages>['messages'];
  addMessage: ReturnType<typeof useMessages>['addMessage'];
  profile: ReturnType<typeof useUserProfile>['profile'];
  memoryContext: ReturnType<typeof useChatMemoryContext>['memoryContext'];
  internalProfileText: ReturnType<typeof useChatMemoryContext>['internalProfileText'];
  internalProfile: ReturnType<typeof useChatMemoryContext>['profile'];
  yesterdayInsight: ReturnType<typeof useExploreInsights>['yesterdayInsight'];
  generalInsight: ReturnType<typeof useExploreInsights>['generalInsight'];
  frequencyInsight: ReturnType<typeof useExploreInsights>['frequencyInsight'];
  habitInsight: ReturnType<typeof useExploreInsights>['habitInsight'];
  deepInsight: ReturnType<typeof useExploreInsights>['deepInsight'];
  deepInsightContent: ReturnType<typeof useExploreInsights>['deepInsightContent'];
  deepInsightProgress: ReturnType<typeof useExploreInsights>['deepInsightProgress'];
  refreshExploreInsights: ReturnType<typeof useExploreInsights>['refreshInsights'];
  unviewedInsightsCount: number;
  markInsightViewed: (key: ExploreInsightKey) => void;
}

const TabScreenContext = createContext<TabScreenContextValue | undefined>(undefined);

export function TabScreenProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { loaded: themeLoaded } = useTheme();
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    memoryContext,
    internalProfileText,
    profile: internalProfile,
    loading: memoryLoading,
  } = useChatMemoryContext();
  const {
    conversations,
    loading: conversationsLoading,
    refetch: refetchConversations,
    getOrCreateTodayConversation,
  } = useConversations();

  const [insightsRefreshToken, setInsightsRefreshToken] = useState(0);

  const {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
    deepInsight,
    deepInsightContent,
    deepInsightProgress,
    isLoading: insightsLoading = false,
    refreshInsights,
  } = useExploreInsights(insightsRefreshToken);

  const { unviewedInsightsCount, markInsightViewed } = useExploreViewedInsights();

  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatConversationReady, setChatConversationReady] = useState(false);
  const [chatHomeResetToken, setChatHomeResetToken] = useState(0);
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [historyTitlesLoading, setHistoryTitlesLoading] = useState(true);

  const resetChatToHome = useCallback(() => {
    clearPendingChatInsight();
    setChatHomeResetToken((token) => token + 1);
    setChatConversationReady(false);

    void getOrCreateTodayConversation().then((conversation) => {
      setChatConversationId(conversation?.id ?? null);
      setChatConversationReady(true);
    });
  }, [getOrCreateTodayConversation]);

  useEffect(() => {
    if (!user?.id) {
      setChatConversationId(null);
      setChatConversationReady(true);
      return;
    }

    let cancelled = false;
    setChatConversationReady(false);

    void getOrCreateTodayConversation().then((conversation) => {
      if (cancelled) return;
      setChatConversationId(conversation?.id ?? null);
      setChatConversationReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, getOrCreateTodayConversation]);

  const { messages, loading: chatMessagesLoading, addMessage } =
    useMessages(chatConversationId);

  useEffect(() => {
    if (!user?.id) {
      setHistoryConversations([]);
      setHistoryTitlesLoading(false);
      return;
    }

    if (conversationsLoading) {
      setHistoryTitlesLoading(true);
      return;
    }

    let cancelled = false;
    setHistoryTitlesLoading(true);

    void prepareHistoryConversationTitles(conversations).then((prepared) => {
      if (cancelled) {
        return;
      }
      setHistoryConversations(prepared);
      setHistoryTitlesLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, conversations, conversationsLoading]);

  const chatReady =
    chatConversationReady &&
    !chatMessagesLoading &&
    !profileLoading &&
    !memoryLoading;

  const exploreReady = !insightsLoading && themeLoaded;
  const historyReady = !conversationsLoading && !historyTitlesLoading && themeLoaded;
  const activitiesReady = themeLoaded;

  const [latchedReady, setLatchedReady] = useState<Record<TabScreenName, boolean>>({
    Chat: false,
    Explore: false,
    History: false,
    Activities: false,
  });

  useEffect(() => {
    if (!user?.id) {
      setLatchedReady({
        Chat: false,
        Explore: false,
        History: false,
        Activities: false,
      });
      return;
    }

    setLatchedReady((prev) => ({
      Chat: prev.Chat || chatReady,
      Explore: prev.Explore || exploreReady,
      History: prev.History || historyReady,
      Activities: prev.Activities || activitiesReady,
    }));
  }, [user?.id, chatReady, exploreReady, historyReady, activitiesReady]);

  const readiness = useMemo(
    () => ({
      Chat: latchedReady.Chat,
      Explore: latchedReady.Explore,
      History: latchedReady.History,
      Activities: latchedReady.Activities,
    }),
    [latchedReady],
  );

  const isTabReady = useCallback(
    (tab: TabScreenName) => readiness[tab],
    [readiness],
  );

  const value = useMemo<TabScreenContextValue>(
    () => ({
      isTabReady,
      chatHomeResetToken,
      resetChatToHome,
      chatConversationId,
      chatConversationReady,
      chatMessagesLoading,
      profileLoading,
      memoryLoading,
      conversationsLoading,
      insightsLoading,
      themeLoaded,
      conversations: historyConversations,
      refetchConversations,
      getOrCreateTodayConversation,
      messages,
      addMessage,
      profile,
      memoryContext,
      internalProfileText,
      internalProfile,
      yesterdayInsight,
      generalInsight,
      frequencyInsight,
      habitInsight,
      deepInsight,
      deepInsightContent,
      deepInsightProgress,
      refreshExploreInsights: refreshInsights,
      unviewedInsightsCount,
      markInsightViewed,
    }),
    [
      isTabReady,
      chatHomeResetToken,
      resetChatToHome,
      chatConversationId,
      chatConversationReady,
      chatMessagesLoading,
      profileLoading,
      memoryLoading,
      conversationsLoading,
      insightsLoading,
      themeLoaded,
      historyConversations,
      refetchConversations,
      getOrCreateTodayConversation,
      messages,
      addMessage,
      profile,
      memoryContext,
      internalProfileText,
      internalProfile,
      yesterdayInsight,
      generalInsight,
      frequencyInsight,
      habitInsight,
      deepInsight,
      deepInsightContent,
      deepInsightProgress,
      refreshInsights,
      unviewedInsightsCount,
      markInsightViewed,
    ],
  );

  return (
    <TabScreenContext.Provider value={value}>{children}</TabScreenContext.Provider>
  );
}

export function useTabScreenContext() {
  const context = useContext(TabScreenContext);
  if (!context) {
    throw new Error('useTabScreenContext must be used within TabScreenProvider');
  }
  return context;
}

export function useTabScreenLoading(tab: TabScreenName) {
  const { isTabReady } = useTabScreenContext();
  return !isTabReady(tab);
}
