import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { countUserTurns, matchApproach } from '@/utils/approachMatcher';
import { buildInsightApproachContext } from '@/utils/buildInsightApproachContext';
import { streamChat, type InsightContext, type UserContext } from '@/utils/chatStream';
import type { ChatInsightParam } from '@/types/chatInsight';
import {
  clearPendingChatInsight,
  consumePendingChatInsight,
  registerChatInsightConsumer,
} from '@/utils/navigateToChat';
import {
  mergeDbAndStreamingMessages,
  registerMessageClientId,
  clearMessageClientIds,
} from '@/utils/mergeChatMessages';
import { syncExploreInsights } from '@/utils/syncExploreInsights';
import type { StreamingMessage } from '@/types/messages';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { getResumableAssistantTranscript } from '@/voice/voiceTranscript';
import type { MainTabNavigationProp } from '@/types/navigation';

interface ChatSessionContextValue {
  currentConversationId: string | null;
  chatHomeResetToken: number;
  allMessages: Array<{
    id: string | number;
    role: 'user' | 'assistant' | 'context';
    content: string;
    createdAt?: string;
    isStreaming?: boolean;
    isRevealing?: boolean;
  }>;
  isStreaming: boolean;
  messagesLoading: boolean;
  memoryLoading: boolean;
  voiceInterfaceRef: RefObject<VoiceInterfaceRef | null>;
  isVoiceModeActive: boolean;
  setIsVoiceModeActive: (active: boolean) => void;
  isVoiceConnecting: boolean;
  setIsVoiceConnecting: (connecting: boolean) => void;
  isVoiceSessionBusy: boolean;
  setIsVoiceSessionBusy: (busy: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (text: string) => void;
  isBudSpeaking: boolean;
  setIsBudSpeaking: (active: boolean) => void;
  userContext: UserContext;
  messageHistory: Array<{ role: string; content: string }>;
  recentInsights: Array<{ insight_type: string; title: string; description: string }>;
  internalProfileText: string | null | undefined;
  handleSendMessage: (message: string, contextOverride?: InsightContext | null) => Promise<void>;
  handleVoiceUserMessage: (text: string) => Promise<void>;
  handleVoiceAssistantMessage: (text: string) => Promise<void>;
  handleEndVoiceSession: () => Promise<void>;
  applyChatInsight: (insight: ChatInsightParam) => void;
  bootstrapInsightSession: () => void;
  trySendPendingInsight: () => void;
  handleVoiceInsight: (insight: {
    insight_type: string;
    title: string;
    description: string;
  }) => void;
  handleAssistantRevealComplete: (messageId: string | number) => void;
}

const ChatSessionContext = createContext<ChatSessionContextValue | undefined>(undefined);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigation = useNavigation<MainTabNavigationProp>();
  const {
    chatConversationId: currentConversationId,
    chatHomeResetToken,
    messages: dbMessages,
    chatMessagesLoading: messagesLoading,
    addMessage,
    profile,
    memoryContext,
    internalProfileText,
    internalProfile,
    memoryLoading,
    refreshExploreInsights,
  } = useTabScreenContext();

  const scheduleInsightSync = useCallback(() => {
    void syncExploreInsights({ force: true }).finally(() => {
      refreshExploreInsights({ cacheOnly: true });
    });
  }, [refreshExploreInsights]);

  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);
  const voiceInterfaceRef = useRef<VoiceInterfaceRef>(null);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [isVoiceSessionBusy, setIsVoiceSessionBusy] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isBudSpeaking, setIsBudSpeaking] = useState(false);
  const [insightContext, setInsightContext] = useState<InsightContext | null>(null);
  const insightContextRef = useRef<InsightContext | null>(null);
  const [recentInsights, setRecentInsights] = useState<
    Array<{ insight_type: string; title: string; description: string }>
  >([]);
  const [shouldAutoStartVoice, setShouldAutoStartVoice] = useState(false);
  const pendingChatInsightRef = useRef<ChatInsightParam | null>(null);
  const didAutoSendInsightRef = useRef(false);
  const messageClientIdsRef = useRef<Map<string, string | number>>(new Map());
  const wasVoiceModeActiveRef = useRef(false);

  const mapChatInsightToContext = useCallback((insight: ChatInsightParam): InsightContext => ({
    insightType: insight.insightType,
    badge: insight.badge,
    title: insight.title,
    contextSummary: insight.contextSummary,
    internalContext: insight.internalContext,
    backgroundType: insight.backgroundType,
    cardDescription: insight.cardDescription,
    conversationId: insight.conversationId,
  }), []);

  const trySendPendingInsightRef = useRef<() => void>(() => {});
  const bootstrapInsightSessionRef = useRef<() => void>(() => {});
  const handledInsightKeyRef = useRef<string | null>(null);
  const isVoiceAutoStartInFlightRef = useRef(false);

  const applyChatInsight = useCallback(
    (insight: ChatInsightParam) => {
      pendingChatInsightRef.current = insight;
      didAutoSendInsightRef.current = false;
      const mappedContext = mapChatInsightToContext(insight);
      insightContextRef.current = mappedContext;
      setInsightContext(mappedContext);
      setRecentInsights([
        {
          insight_type: insight.insightType,
          title: insight.contextSummary,
          description: insight.internalContext,
        },
      ]);
      if (insight.autoStartVoice) {
        setShouldAutoStartVoice(true);
      }
    },
    [mapChatInsightToContext],
  );

  const handleVoiceInsight = useCallback(
    (insight: { insight_type: string; title: string; description: string }) => {
      setRecentInsights([
        {
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
        },
      ]);
      setShouldAutoStartVoice(true);
    },
    [],
  );

  useEffect(() => {
    if (chatHomeResetToken === 0) return;

    handledInsightKeyRef.current = null;
    isVoiceAutoStartInFlightRef.current = false;
    setStreamingMessages([]);
    setIsStreaming(false);
    streamingIdRef.current = null;
    clearMessageClientIds(messageClientIdsRef.current);
    setIsVoiceModeActive(false);
    setIsVoiceConnecting(false);
    setIsVoiceSessionBusy(false);
    setVoiceTranscript('');
    setIsBudSpeaking(false);
    setInsightContext(null);
    insightContextRef.current = null;
    setRecentInsights([]);
    setShouldAutoStartVoice(false);
    pendingChatInsightRef.current = null;
    didAutoSendInsightRef.current = false;
    wasVoiceModeActiveRef.current = false;
    clearPendingChatInsight();
    navigation.setParams({ voiceInsight: undefined, chatInsight: undefined });
    void voiceInterfaceRef.current?.endConversation({ force: true });
  }, [chatHomeResetToken, navigation]);

  useEffect(() => {
    if (streamingMessages.length === 0) return;

    const allStreamingInDb = streamingMessages.every((streamMsg) => {
      if (streamMsg.isStreaming || streamMsg.isRevealing) return false;
      if (!streamMsg.content.trim()) return false;

      return dbMessages.some(
        (dbMsg) => dbMsg.role === streamMsg.role && dbMsg.content === streamMsg.content,
      );
    });

    if (allStreamingInDb) {
      setStreamingMessages([]);
    }
  }, [dbMessages, streamingMessages]);

  const allMessages = useMemo(
    () =>
      mergeDbAndStreamingMessages(
        dbMessages,
        streamingMessages,
        messageClientIdsRef.current,
      ),
    [dbMessages, streamingMessages],
  );

  useEffect(() => {
    const justActivated = isVoiceModeActive && !wasVoiceModeActiveRef.current;
    wasVoiceModeActiveRef.current = isVoiceModeActive;

    if (!justActivated) return;

    setVoiceTranscript(getResumableAssistantTranscript(allMessages));
  }, [isVoiceModeActive, allMessages]);

  const userContext = useMemo<UserContext>(() => {
    const todayMessages = dbMessages.filter(
      (msg) => msg.conversation_id === currentConversationId,
    );
    const isFirstInteractionOfDay = todayMessages.length === 0;

    return {
      name: profile?.name || null,
      initialThoughts: profile?.initial_thoughts || null,
      conversationGoal: profile?.conversation_goal || null,
      occupation: profile?.occupation || null,
      age: profile?.age || null,
      gender: profile?.gender || null,
      relationship: profile?.relationship || null,
      hobbies: profile?.hobbies || null,
      isFirstInteractionOfDay,
    };
  }, [profile, dbMessages, currentConversationId]);

  const messageHistory = useMemo(
    () => dbMessages.map((msg) => ({ role: msg.role, content: msg.content })),
    [dbMessages],
  );

  const handleVoiceUserMessage = useCallback(
    async (text: string) => {
      if (!currentConversationId || !text.trim()) return;
      await addMessage(text, 'user');
    },
    [currentConversationId, addMessage],
  );

  const handleVoiceAssistantMessage = useCallback(
    async (text: string) => {
      if (!currentConversationId || !text.trim()) return;
      await addMessage(text, 'assistant');
      scheduleInsightSync();
    },
    [currentConversationId, addMessage, scheduleInsightSync],
  );

  const handleEndVoiceSession = useCallback(async () => {
    await voiceInterfaceRef.current?.endConversation();
  }, []);

  const handleAssistantRevealComplete = useCallback((messageId: string | number) => {
    setStreamingMessages((prev) =>
      prev.map((msg) =>
        String(msg.id) === String(messageId)
          ? { ...msg, isRevealing: false }
          : msg,
      ),
    );
  }, []);

  const handleSendMessage = useCallback(
    async (message: string, contextOverride?: InsightContext | null) => {
      if (!currentConversationId || !user) return;

      const activeInsightContext =
        contextOverride ?? insightContextRef.current ?? insightContext;

      const userMessageId = `user-${Date.now()}`;
      registerMessageClientId(messageClientIdsRef.current, 'user', message, userMessageId);
      setStreamingMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);

      const userMessagePromise = addMessage(message, 'user');

      const apiMessages = [
        ...dbMessages
          .filter((m) => m.role !== 'context' || !m.role)
          .map((m) => ({
            role: (m.role === 'context' ? 'user' : m.role) as 'user' | 'assistant',
            content: m.content,
          })),
        { role: 'user' as const, content: message },
      ];

      setIsStreaming(true);
      const assistantMessageId = `assistant-${Date.now()}`;
      streamingIdRef.current = assistantMessageId;

      setStreamingMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          createdAt: new Date().toISOString(),
        },
      ]);

      let accumulatedContent = '';

      const approachDecision = matchApproach(
        message,
        memoryLoading ? null : internalProfile,
        countUserTurns(apiMessages),
      );

      const streamUserContext = activeInsightContext
        ? { ...userContext, isFirstInteractionOfDay: true }
        : userContext;

      const streamApproachContext = activeInsightContext
        ? buildInsightApproachContext(activeInsightContext)
        : {
            strategy: approachDecision.strategy,
            guidanceText: approachDecision.guidanceText,
          };

      await streamChat({
        messages: apiMessages,
        userContext: streamUserContext,
        insightContext: activeInsightContext ?? undefined,
        memoryContext: memoryLoading ? undefined : memoryContext,
        approachContext: streamApproachContext,
        onDelta: (deltaText) => {
          accumulatedContent += deltaText;
          setStreamingMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg,
            ),
          );
        },
        onDone: async () => {
          registerMessageClientId(
            messageClientIdsRef.current,
            'assistant',
            accumulatedContent,
            assistantMessageId,
          );
          setIsStreaming(false);
          setStreamingMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false, isRevealing: true }
                : msg,
            ),
          );
          streamingIdRef.current = null;

          await userMessagePromise;
          await addMessage(accumulatedContent, 'assistant');
          scheduleInsightSync();
        },
        onError: (error) => {
          setIsStreaming(false);
          alert(`Erro: ${error}`);
          setStreamingMessages((prev) =>
            prev.filter((msg) => msg.id !== assistantMessageId),
          );
          streamingIdRef.current = null;
        },
      });
    },
    [
      currentConversationId,
      user,
      dbMessages,
      userContext,
      insightContext,
      memoryContext,
      memoryLoading,
      internalProfile,
      addMessage,
      scheduleInsightSync,
    ],
  );

  const bootstrapInsightSession = useCallback(() => {
    const pending = pendingChatInsightRef.current;

    if (
      pending?.initialUserMessage?.trim() &&
      currentConversationId &&
      user &&
      !didAutoSendInsightRef.current &&
      !isStreaming
    ) {
      didAutoSendInsightRef.current = true;
      const message = pending.initialUserMessage.trim();
      const context = mapChatInsightToContext(pending);
      pendingChatInsightRef.current = null;
      void handleSendMessage(message, context);
      return;
    }

    if (
      !shouldAutoStartVoice ||
      !currentConversationId ||
      !voiceInterfaceRef.current ||
      isVoiceAutoStartInFlightRef.current
    ) {
      return;
    }

    isVoiceAutoStartInFlightRef.current = true;
    void voiceInterfaceRef.current
      .startConversation()
      .catch(() => {
        // startConversation already alerts on most failures
      })
      .finally(() => {
        isVoiceAutoStartInFlightRef.current = false;
        setShouldAutoStartVoice(false);
      });
  }, [
    currentConversationId,
    handleSendMessage,
    isStreaming,
    mapChatInsightToContext,
    shouldAutoStartVoice,
    user,
  ]);

  const trySendPendingInsight = useCallback(() => {
    bootstrapInsightSession();
  }, [bootstrapInsightSession]);

  trySendPendingInsightRef.current = trySendPendingInsight;
  bootstrapInsightSessionRef.current = bootstrapInsightSession;

  const processIncomingChatInsight = useCallback(
    (insight: ChatInsightParam) => {
      const insightKey = `${insight.insightType}:${insight.title}:${insight.initialUserMessage ?? ''}:${insight.autoStartVoice ? 'voice' : 'text'}`;
      if (handledInsightKeyRef.current === insightKey) return;
      handledInsightKeyRef.current = insightKey;

      applyChatInsight(insight);
      requestAnimationFrame(() => {
        bootstrapInsightSessionRef.current();
      });
    },
    [applyChatInsight],
  );

  useEffect(() => {
    registerChatInsightConsumer(processIncomingChatInsight);
    consumePendingChatInsight();

    return () => {
      registerChatInsightConsumer(null);
    };
  }, [processIncomingChatInsight]);

  useFocusEffect(
    useCallback(() => {
      consumePendingChatInsight();
    }, []),
  );

  useEffect(() => {
    bootstrapInsightSession();
  }, [bootstrapInsightSession]);

  const value = useMemo<ChatSessionContextValue>(
    () => ({
      currentConversationId,
      chatHomeResetToken,
      allMessages,
      isStreaming,
      messagesLoading,
      memoryLoading,
      voiceInterfaceRef,
      isVoiceModeActive,
      setIsVoiceModeActive,
      isVoiceConnecting,
      setIsVoiceConnecting,
      isVoiceSessionBusy,
      setIsVoiceSessionBusy,
      voiceTranscript,
      setVoiceTranscript,
      isBudSpeaking,
      setIsBudSpeaking,
      userContext,
      messageHistory,
      recentInsights,
      internalProfileText,
      handleSendMessage,
      handleVoiceUserMessage,
      handleVoiceAssistantMessage,
      handleEndVoiceSession,
      applyChatInsight,
      bootstrapInsightSession,
      trySendPendingInsight,
      handleVoiceInsight,
      handleAssistantRevealComplete,
    }),
    [
      currentConversationId,
      chatHomeResetToken,
      allMessages,
      isStreaming,
      messagesLoading,
      memoryLoading,
      isVoiceModeActive,
      isVoiceConnecting,
      isVoiceSessionBusy,
      voiceTranscript,
      isBudSpeaking,
      userContext,
      messageHistory,
      recentInsights,
      internalProfileText,
      handleSendMessage,
      handleVoiceUserMessage,
      handleVoiceAssistantMessage,
      handleEndVoiceSession,
      applyChatInsight,
      bootstrapInsightSession,
      trySendPendingInsight,
      handleVoiceInsight,
      handleAssistantRevealComplete,
    ],
  );

  return (
    <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>
  );
}

export function useChatSession() {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error('useChatSession must be used within ChatSessionProvider');
  }
  return context;
}
