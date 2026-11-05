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

import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { ACTION_EVENTS, logActionEvent } from '@/analytics';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { countUserTurns, matchApproach } from '@/utils/approachMatcher';
import { buildInsightApproachContext } from '@/utils/buildInsightApproachContext';
import { isIncompleteAssistantReply } from '@/utils/chatReplyQuality';
import { streamChat, type InsightContext, type UserContext } from '@/utils/chatStream';
import {
  buildChatImageApiContent,
  chatMessageTextForModel,
  CHAT_IMAGE_HISTORY_TEXT,
  validateChatGalleryImage,
  type ChatApiContent,
  type ChatGalleryImage,
} from '@/utils/chatImageMessage';
import { storeChatImage } from '@/utils/uploadChatImage';
import { appAlert } from '@/contexts/AppAlertContext';
import { userContextFieldsFromProfile } from '@/utils/userContextFromProfile';
import type { ChatInsightParam } from '@/types/chatInsight';
import type { ChatTabParams, MainTabNavigationProp } from '@/types/navigation';
import {
  clearPendingChatInsight,
  consumePendingChatInsight,
  registerChatInsightConsumer,
  takePendingChatInsight,
} from '@/utils/navigateToChat';
import {
  clearMessageClientIds,
  createStreamingMessageId,
  mergeDbAndStreamingMessages,
  registerMessageClientId,
} from '@/utils/mergeChatMessages';
import { serializeInsightContextMessage } from '@/utils/insightContextMessage';
import { buildInsightVoiceFirstMessage } from '@/utils/insightVoiceOpening';
import { sanitizeAssistantPortuguese } from '@/utils/portugueseText';
import { scheduleSessionMemory } from '@/utils/scheduleSessionMemory';
import type { StreamingMessage } from '@/types/messages';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { getResumableAssistantTranscript } from '@/voice/voiceTranscript';

interface ChatSessionContextValue {
  currentConversationId: string | null;
  chatHomeResetToken: number;
  allMessages: Array<{
    id: string | number;
    role: 'user' | 'assistant' | 'context';
    content: string;
    imageUri?: string;
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
  handleSendImage: (image: ChatGalleryImage) => Promise<void>;
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
  const { canSendMessage } = useUserPlan();
  const navigation = useNavigation<MainTabNavigationProp>();
  const canSendMessageRef = useRef(canSendMessage);
  canSendMessageRef.current = canSendMessage;
  const route = useRoute();
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
  } = useTabScreenContext();

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
  const voiceSessionStartMsRef = useRef<number | null>(null);

  const mapChatInsightToContext = useCallback((insight: ChatInsightParam): InsightContext => ({
    insightType: insight.insightType,
    internalContext: insight.internalContext,
    contextSummary: insight.contextSummary,
    conversationId: insight.conversationId,
    title: insight.title,
    badge: insight.badge,
    cardDescription: insight.cardDescription,
    backgroundType: insight.backgroundType,
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
          title: insight.title,
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
    const wasActive = wasVoiceModeActiveRef.current;
    const justActivated = isVoiceModeActive && !wasActive;
    const justDeactivated = !isVoiceModeActive && wasActive;
    wasVoiceModeActiveRef.current = isVoiceModeActive;

    if (justActivated) {
      voiceSessionStartMsRef.current = Date.now();
      void logActionEvent(ACTION_EVENTS.VOICE_SESSION_STARTED, { source: 'chat' });
    }

    if (justDeactivated) {
      const startMs = voiceSessionStartMsRef.current;
      voiceSessionStartMsRef.current = null;
      const durationSeconds = startMs ? Math.round((Date.now() - startMs) / 1000) : 0;
      void logActionEvent(ACTION_EVENTS.VOICE_SESSION_ENDED, {
        duration_seconds: durationSeconds,
      });
    }

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
      ...userContextFieldsFromProfile(profile),
      isFirstInteractionOfDay,
    };
  }, [profile, dbMessages, currentConversationId, insightContext]);

  const messageHistory = useMemo(
    () =>
      dbMessages.map((msg) => ({
        role: msg.role,
        content: chatMessageTextForModel(msg.content),
      })),
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
      const sanitized = sanitizeAssistantPortuguese(text);
      await addMessage(sanitized, 'assistant');
      scheduleSessionMemory(currentConversationId, dbMessages.length + 1);
    },
    [currentConversationId, addMessage, dbMessages.length],
  );

  const handleEndVoiceSession = useCallback(async () => {
    // force: always tear down audio + phase even if onDisconnect is late
    await voiceInterfaceRef.current?.endConversation({ force: true });
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

  const streamAssistantReply = useCallback(
    async ({
      apiMessages,
      activeInsightContext,
      approachSeed,
      persistUserMessage,
    }: {
      apiMessages: Array<{ role: 'user' | 'assistant'; content: ChatApiContent }>;
      activeInsightContext?: InsightContext | null;
      approachSeed: string;
      persistUserMessage?: Promise<unknown>;
    }) => {
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
        approachSeed,
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
            if (!accumulatedContent.trim() || isIncompleteAssistantReply(accumulatedContent)) {
              setIsStreaming(false);
              sendInFlightRef.current = false;
              setStreamingMessages((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId),
              );
              streamingIdRef.current = null;
              alert('Não foi possível gerar uma resposta completa.');
              return;
            }

            accumulatedContent = sanitizeAssistantPortuguese(accumulatedContent);
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
                  ? {
                      ...msg,
                      content: accumulatedContent,
                      isStreaming: false,
                      isRevealing: true,
                    }
                  : msg,
              ),
            );
            streamingIdRef.current = null;

            if (persistUserMessage) {
              await persistUserMessage;
            }
            await addMessage(accumulatedContent, 'assistant');
            scheduleSessionMemory(
              currentConversationId!,
              dbMessages.length + (persistUserMessage ? 2 : 1),
            );
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
      addMessage,
      currentConversationId,
      dbMessages.length,
      internalProfile,
      memoryContext,
      memoryLoading,
      userContext,
    ],
  );

  const handleOpenInsightConversation = useCallback(
    async (insight: ChatInsightParam, contextOverride?: InsightContext | null) => {
      if (!currentConversationId || !user || sendInFlightRef.current) return;
      if (!canSendMessageRef.current) {
        navigation.navigate('Paywall');
        return;
      }

      sendInFlightRef.current = true;

      const baseContext = contextOverride ?? mapChatInsightToContext(insight);
      const explorationTheme = insight.initialUserMessage?.trim();
      const activeInsightContext: InsightContext = {
        ...baseContext,
        internalContext: [
          baseContext.internalContext?.trim(),
          explorationTheme
            ? `Tema escolhido pela pessoa para explorar: ${explorationTheme}`
            : null,
          'O texto do insight ativo é sobre a pessoa e ela escolheu conversar sobre isso; nunca responda como se fosse uma pergunta para você.',
        ]
          .filter((part): part is string => Boolean(part))
          .join('\n\n'),
      };

      insightContextRef.current = activeInsightContext;
      setInsightContext(activeInsightContext);

      void logActionEvent(ACTION_EVENTS.MESSAGE_SENT, {
        has_insight_context: 'true',
      });

      const historyMessages = dbMessages
        .filter((m) => m.role !== 'context')
        .map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: chatMessageTextForModel(m.content),
        }));

      const openingCue =
        '[Sistema: a pessoa escolheu explorar o insight ativo. Abra a conversa no tema dela, falando sobre ela — nunca como se o insight fosse uma pergunta dirigida a você. Não cumprimente de novo. Não diga boa pergunta.]';

      await streamAssistantReply({
        apiMessages: [...historyMessages, { role: 'user', content: openingCue }],
        activeInsightContext,
        approachSeed: explorationTheme || insight.title || insight.contextSummary || '',
      });
    },
    [
      currentConversationId,
      dbMessages,
      mapChatInsightToContext,
      navigation,
      streamAssistantReply,
      user,
    ],
  );

  const handleSendMessage = useCallback(
    async (
      message: string,
      contextOverride?: InsightContext | null,
      options?: { imageUri?: string; apiContent?: ChatApiContent; skipLock?: boolean },
    ) => {
      if (!currentConversationId || !user) {
        sendInFlightRef.current = false;
        return;
      }
      if (!options?.skipLock) {
        if (sendInFlightRef.current) return;
        sendInFlightRef.current = true;
      }
      if (!canSendMessageRef.current) {
        sendInFlightRef.current = false;
        setIsStreaming(false);
        navigation.navigate('Paywall');
        return;
      }

      const activeInsightContext =
        contextOverride ?? insightContextRef.current ?? insightContext;
      const attached = Boolean(options?.apiContent);

      void logActionEvent(ACTION_EVENTS.MESSAGE_SENT, {
        has_insight_context: activeInsightContext ? 'true' : 'false',
        has_attachment: attached ? 'true' : 'false',
      });
      if (attached) {
        void logActionEvent(ACTION_EVENTS.ATTACHMENT_SENT, { tipo: 'image' });
      }

      const userMessageId = createStreamingMessageId('user');
      registerMessageClientId(messageClientIdsRef.current, 'user', message, userMessageId);
      setStreamingMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: message,
          imageUri: options?.imageUri,
          createdAt: new Date().toISOString(),
        },
      ]);

      const userMessagePromise = addMessage(message, 'user');

      const apiMessages = [
        ...dbMessages
          .filter((m) => m.role !== 'context' || !m.role)
          .map((m) => ({
            role: (m.role === 'context' ? 'user' : m.role) as 'user' | 'assistant',
            content: chatMessageTextForModel(m.content),
          })),
        { role: 'user' as const, content: options?.apiContent ?? message },
      ];

      await streamAssistantReply({
        apiMessages,
        activeInsightContext,
        approachSeed: attached ? CHAT_IMAGE_HISTORY_TEXT : message,
        persistUserMessage: userMessagePromise,
      });
    },
    [
      addMessage,
      currentConversationId,
      dbMessages,
      insightContext,
      navigation,
      streamAssistantReply,
      user,
    ],
  );

  const handleSendImage = useCallback(
    async (image: ChatGalleryImage) => {
      if (!currentConversationId || !user || sendInFlightRef.current) return;
      if (!canSendMessageRef.current) {
        navigation.navigate('Paywall');
        return;
      }

      const validationError = validateChatGalleryImage(image);
      if (validationError) {
        appAlert({ title: 'Foto', message: validationError });
        return;
      }

      sendInFlightRef.current = true;
      setIsStreaming(true);

      try {
        const stored = await storeChatImage({
          userId: user.id,
          conversationId: currentConversationId,
          base64: image.base64,
        });
        if (!stored) {
          sendInFlightRef.current = false;
          setIsStreaming(false);
          appAlert({
            title: 'Foto',
            message: 'Não foi possível enviar a foto. Tente outra imagem.',
          });
          return;
        }

        await handleSendMessage(stored, null, {
          imageUri: image.uri,
          apiContent: buildChatImageApiContent(image.base64),
          skipLock: true,
        });
      } catch {
        sendInFlightRef.current = false;
        setIsStreaming(false);
        appAlert({
          title: 'Foto',
          message: 'Não foi possível enviar a foto. Tente outra imagem.',
        });
      }
    },
    [currentConversationId, handleSendMessage, navigation, user],
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
      if (!canSendMessageRef.current) {
        navigation.navigate('Paywall');
        return;
      }
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
      pending &&
      currentConversationId &&
      user &&
      !didAutoSendInsightRef.current &&
      !isStreaming &&
      !sendInFlightRef.current
    ) {
      didAutoSendInsightRef.current = true;
      const insight = pending;
      const context = mapChatInsightToContext(insight);
      pendingChatInsightRef.current = null;
      void (async () => {
        try {
          await persistInsightContextCard(insight);
        } catch {
          didPersistContextRef.current = false;
        }
        await handleOpenInsightConversation(insight, context);
      })();
    }
  }, [
    currentConversationId,
    handleOpenInsightConversation,
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
      const isSamePending =
        handledInsightKeyRef.current === insightKey && pendingChatInsightRef.current;

      if (isSamePending) {
        requestAnimationFrame(() => {
          bootstrapInsightSessionRef.current();
        });
        return;
      }

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

    return () => {
      registerChatInsightConsumer(null);
    };
  }, [processIncomingChatInsight]);

  useFocusEffect(
    useCallback(() => {
      const fromParams = (route.params as ChatTabParams | undefined)?.chatInsight;
      const fromStash = takePendingChatInsight();
      const insight = fromParams ?? fromStash;
      if (insight) {
        processIncomingChatInsight(insight);
        if (fromParams) {
          navigation.setParams({ chatInsight: undefined });
        }
        return;
      }

      consumePendingChatInsight();
      bootstrapInsightSessionRef.current();
    }, [navigation, processIncomingChatInsight, route.params]),
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
      handleSendImage,
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
      handleSendImage,
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
