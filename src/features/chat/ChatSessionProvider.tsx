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

import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';

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
  clearMessageClientIds,
  createStreamingMessageId,
  mergeDbAndStreamingMessages,
  registerMessageClientId,
} from '@/utils/mergeChatMessages';
import { serializeInsightContextMessage } from '@/utils/insightContextMessage';
import { buildInsightVoiceFirstMessage } from '@/utils/insightVoiceOpening';
import { syncExploreInsights } from '@/utils/syncExploreInsights';
import { scheduleSessionMemory } from '@/utils/scheduleSessionMemory';
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
  isVoicePaused: boolean;
  setIsVoicePaused: (paused: boolean) => void;
  isVoiceMicMuted: boolean;
  setIsVoiceMicMuted: (muted: boolean) => void;
  userContext: UserContext;
  messageHistory: Array<{ role: string; content: string }>;
  recentInsights: Array<{ insight_type: string; title: string; description: string }>;
  internalProfileText: string | null | undefined;
  handleSendMessage: (message: string, contextOverride?: InsightContext | null) => Promise<void>;
  handleVoiceUserMessage: (text: string) => Promise<void>;
  handleVoiceAssistantMessage: (text: string) => Promise<void>;
  handleEndVoiceSession: () => Promise<void>;
  handleToggleVoicePause: () => void;
  handleToggleVoiceMute: () => void;
  applyChatInsight: (insight: ChatInsightParam) => void;
  requestAutoStartVoice: () => void;
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
  const isChatFocused = useIsFocused();
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
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [isVoiceMicMuted, setIsVoiceMicMuted] = useState(false);
  const [insightContext, setInsightContext] = useState<InsightContext | null>(null);
  const insightContextRef = useRef<InsightContext | null>(null);
  const [recentInsights, setRecentInsights] = useState<
    Array<{ insight_type: string; title: string; description: string }>
  >([]);
  const [shouldAutoStartVoice, setShouldAutoStartVoice] = useState(false);
  const pendingChatInsightRef = useRef<ChatInsightParam | null>(null);
  const didAutoSendInsightRef = useRef(false);
  const didPersistContextRef = useRef(false);
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
  const sendInFlightRef = useRef(false);

  const applyChatInsight = useCallback(
    (insight: ChatInsightParam) => {
      pendingChatInsightRef.current = insight;
      didAutoSendInsightRef.current = false;
      didPersistContextRef.current = false;
      const mappedContext = mapChatInsightToContext(insight);
      insightContextRef.current = mappedContext;
      setInsightContext(mappedContext);
      setRecentInsights([
        {
          insight_type: insight.insightType,
          title: insight.cardDescription || insight.contextSummary || insight.title,
          description: insight.internalContext,
        },
      ]);
      setShouldAutoStartVoice(Boolean(insight.autoStartVoice));
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

  const requestAutoStartVoice = useCallback(() => {
    setShouldAutoStartVoice(true);
  }, []);

  useEffect(() => {
    if (chatHomeResetToken === 0) return;

    handledInsightKeyRef.current = null;
    isVoiceAutoStartInFlightRef.current = false;
    sendInFlightRef.current = false;
    setStreamingMessages([]);
    setIsStreaming(false);
    streamingIdRef.current = null;
    clearMessageClientIds(messageClientIdsRef.current);
    setIsVoiceModeActive(false);
    setIsVoiceConnecting(false);
    setIsVoiceSessionBusy(false);
    setVoiceTranscript('');
    setIsBudSpeaking(false);
    setIsVoicePaused(false);
    setIsVoiceMicMuted(false);
    setInsightContext(null);
    insightContextRef.current = null;
    setRecentInsights([]);
    setShouldAutoStartVoice(false);
    pendingChatInsightRef.current = null;
    didAutoSendInsightRef.current = false;
    didPersistContextRef.current = false;
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

    if (!isVoiceModeActive) {
      setIsVoicePaused(false);
      setIsVoiceMicMuted(false);
      return;
    }

    if (!justActivated) return;

    setVoiceTranscript(getResumableAssistantTranscript(allMessages));
  }, [isVoiceModeActive, allMessages]);

  const userContext = useMemo<UserContext>(() => {
    const todayMessages = dbMessages.filter(
      (msg) => msg.conversation_id === currentConversationId && msg.role !== 'context',
    );
    const isFirstInteractionOfDay = todayMessages.length === 0 || Boolean(insightContext);

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
  }, [profile, dbMessages, currentConversationId, insightContext]);

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
      scheduleSessionMemory(currentConversationId, dbMessages.length + 1);
    },
    [currentConversationId, addMessage, scheduleInsightSync, dbMessages.length],
  );

  const handleEndVoiceSession = useCallback(async () => {
    await voiceInterfaceRef.current?.endConversation();
  }, []);

  const handleToggleVoicePause = useCallback(() => {
    voiceInterfaceRef.current?.togglePaused();
  }, []);

  const handleToggleVoiceMute = useCallback(() => {
    voiceInterfaceRef.current?.toggleMicMuted();
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

  const persistInsightContextCard = useCallback(
    async (insight: ChatInsightParam) => {
      if (didPersistContextRef.current || !currentConversationId) {
        return;
      }

      didPersistContextRef.current = true;
      const content = serializeInsightContextMessage(insight);
      const contextMessageId = createStreamingMessageId('context');
      registerMessageClientId(
        messageClientIdsRef.current,
        'context',
        content,
        contextMessageId,
      );
      setStreamingMessages((prev) => [
        ...prev,
        {
          id: contextMessageId,
          role: 'context',
          content,
          createdAt: new Date().toISOString(),
        },
      ]);
      try {
        await addMessage(content, 'context');
      } catch {
        didPersistContextRef.current = false;
      }
    },
    [addMessage, currentConversationId],
  );

  const handleSendMessage = useCallback(
    async (message: string, contextOverride?: InsightContext | null) => {
      if (!currentConversationId || !user || sendInFlightRef.current) return;

      sendInFlightRef.current = true;

      const activeInsightContext =
        contextOverride ?? insightContextRef.current ?? insightContext;

      const userMessageId = createStreamingMessageId('user');
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
      const assistantMessageId = createStreamingMessageId('assistant');
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

      try {
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
            sendInFlightRef.current = false;
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
            scheduleSessionMemory(currentConversationId, dbMessages.length + 2);
          },
          onError: (error) => {
            setIsStreaming(false);
            sendInFlightRef.current = false;
            alert(`Erro: ${error}`);
            setStreamingMessages((prev) =>
              prev.filter((msg) => msg.id !== assistantMessageId),
            );
            streamingIdRef.current = null;
          },
        });
      } catch {
        setIsStreaming(false);
        sendInFlightRef.current = false;
        streamingIdRef.current = null;
      }
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
    if (!isChatFocused) return;

    const pending = pendingChatInsightRef.current;
    const shouldStartVoice = pending
      ? Boolean(pending.autoStartVoice)
      : shouldAutoStartVoice;

    if (
      shouldStartVoice &&
      currentConversationId &&
      !isVoiceAutoStartInFlightRef.current
    ) {
      if (!voiceInterfaceRef.current) {
        requestAnimationFrame(() => {
          bootstrapInsightSessionRef.current();
        });
        return;
      }

      isVoiceAutoStartInFlightRef.current = true;
      const insight = pending;
      pendingChatInsightRef.current = null;

      void (async () => {
        try {
          if (insight) {
            try {
              await persistInsightContextCard(insight);
            } catch {
              didPersistContextRef.current = false;
            }
          }
          const firstMessage = insight
            ? buildInsightVoiceFirstMessage(insight)
            : undefined;
          await voiceInterfaceRef.current?.startConversation(
            firstMessage ? { firstMessage } : undefined,
          );
        } catch {
          // startConversation already alerts on most failures
        } finally {
          isVoiceAutoStartInFlightRef.current = false;
          setShouldAutoStartVoice(false);
        }
      })();
      return;
    }

    if (
      pending?.initialUserMessage?.trim() &&
      currentConversationId &&
      user &&
      !didAutoSendInsightRef.current &&
      !isStreaming &&
      !sendInFlightRef.current
    ) {
      didAutoSendInsightRef.current = true;
      const insight = pending;
      const message = insight.initialUserMessage?.trim() ?? '';
      const context = mapChatInsightToContext(insight);
      pendingChatInsightRef.current = null;
      void (async () => {
        try {
          await persistInsightContextCard(insight);
        } catch {
          didPersistContextRef.current = false;
        }
        await handleSendMessage(message, context);
      })();
    }
  }, [
    currentConversationId,
    handleSendMessage,
    isChatFocused,
    isStreaming,
    mapChatInsightToContext,
    persistInsightContextCard,
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
      isVoicePaused,
      setIsVoicePaused,
      isVoiceMicMuted,
      setIsVoiceMicMuted,
      userContext,
      messageHistory,
      recentInsights,
      internalProfileText,
      handleSendMessage,
      handleVoiceUserMessage,
      handleVoiceAssistantMessage,
      handleEndVoiceSession,
      handleToggleVoicePause,
      handleToggleVoiceMute,
      applyChatInsight,
      requestAutoStartVoice,
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
      isVoicePaused,
      isVoiceMicMuted,
      userContext,
      messageHistory,
      recentInsights,
      internalProfileText,
      handleSendMessage,
      handleVoiceUserMessage,
      handleVoiceAssistantMessage,
      handleEndVoiceSession,
      handleToggleVoicePause,
      handleToggleVoiceMute,
      applyChatInsight,
      requestAutoStartVoice,
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
