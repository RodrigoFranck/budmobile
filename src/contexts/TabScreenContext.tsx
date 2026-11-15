import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { InteractionManager } from 'react-native';

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
import { bootMarkOnce } from '@/utils/bootTiming';
import type { MainTabParamList } from '@/types/navigation';
import type { Tables } from '@/integrations/supabase/types';
import type { ExploreInsightKey } from '@/constants/exploreInsights';

type Conversation = Tables<'conversations'>;

export type TabScreenName = 'Home' | 'Chat' | 'Explore' | 'History' | 'Activities';

interface TabScreenContextValue {
  isTabReady: (tab: TabScreenName) => boolean;
  chatHomeResetToken: number;
  resetChatToHome: () => void;
  chatConversationId: string | null;
  chatMessagesLoading: boolean;
  profileLoading: boolean;
  memoryLoading: boolean;
  conversationsLoading: boolean;
  historyTitlesLoading: boolean;
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
    // Chat bootstrap is not on the Home critical path — defer after first paint.
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const started = Date.now();
      void getOrCreateTodayConversation().then((conversation) => {
        if (cancelled) return;
        setChatConversationId(conversation?.id ?? null);
        setChatConversationReady(true);
        bootMarkOnce('chat_today_conversation_ready', { ms: Date.now() - started });
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
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

    bootMarkOnce('home_conversations_ready', { count: conversations.length });
    // Expose conversations immediately so Home can paint; title AI runs after.
    setHistoryConversations(conversations);
    setHistoryTitlesLoading(false);

    let cancelled = false;
    const started = Date.now();
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      void prepareHistoryConversationTitles(conversations).then((prepared) => {
        if (cancelled) {
          return;
        }
        setHistoryConversations(prepared);
        bootMarkOnce('history_titles_ready', {
          ms: Date.now() - started,
          count: prepared.length,
        });
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [user?.id, conversations, conversationsLoading]);

  useEffect(() => {
    if (!conversationsLoading) return;
    bootMarkOnce('home_conversations_loading');
  }, [conversationsLoading]);

  useEffect(() => {
    if (insightsLoading) {
      bootMarkOnce('explore_insights_loading');
      return;
    }
    bootMarkOnce('explore_insights_ready');
  }, [insightsLoading]);

  const chatReady =
    chatConversationReady &&
    !chatMessagesLoading &&
    !profileLoading &&
    !memoryLoading;

  const exploreReady = !insightsLoading && themeLoaded;
  const historyReady = !conversationsLoading && !historyTitlesLoading && themeLoaded;
  // Splash / Home shell only needs theme + profile (greeting). Letter, insights,
  // history titles and Para começar load after Home is already visible.
  const homeReady = themeLoaded && !profileLoading;
  const activitiesReady = themeLoaded;

  const [latchedReady, setLatchedReady] = useState<Record<TabScreenName, boolean>>({
    Home: false,
    Chat: false,
    Explore: false,
    History: false,
    Activities: false,
  });

  useEffect(() => {
    if (!user?.id) {
      setLatchedReady({
        Home: false,
        Chat: false,
        Explore: false,
        History: false,
        Activities: false,
      });
      return;
    }

    setLatchedReady((prev) => ({
      Home: prev.Home || homeReady,
      Chat: prev.Chat || chatReady,
      Explore: prev.Explore || exploreReady,
      History: prev.History || historyReady,
      Activities: prev.Activities || activitiesReady,
    }));
  }, [user?.id, chatReady, exploreReady, homeReady, historyReady, activitiesReady]);

  const readiness = useMemo(
    () => ({
      Home: latchedReady.Home,
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
      historyTitlesLoading,
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
      historyTitlesLoading,
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
