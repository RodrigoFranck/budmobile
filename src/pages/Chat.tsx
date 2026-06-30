import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Book, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTabScreenContext,
  useTabScreenLoading,
} from '@/contexts/TabScreenContext';
import { countUserTurns, matchApproach } from '@/utils/approachMatcher';
import { streamChat, type InsightContext, type UserContext } from '@/utils/chatStream';
import type { ChatInsightParam } from '@/types/chatInsight';
import { takePendingChatInsight, clearPendingChatInsight } from '@/utils/navigateToChat';
import type { StreamingMessage } from '@/types/messages';
import {
  mergeDbAndStreamingMessages,
  registerMessageClientId,
  clearMessageClientIds,
} from '@/utils/mergeChatMessages';
import { PlatformConstants } from '@/constants/layout';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { VoiceMode } from '@/voice/VoiceMode';
import { useAppColors } from '@/lib/colors';
import type { MainTabNavigationProp, MainTabParamList, RootNavigationProp } from '@/types/navigation';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { Spacing } from '@/constants/styles';

export default function ChatScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const tabLoading = useTabScreenLoading('Chat');
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
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isBudSpeaking, setIsBudSpeaking] = useState(false);
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const navigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const [insightContext, setInsightContext] = useState<InsightContext | null>(null);
  const [recentInsights, setRecentInsights] = useState<
    Array<{ insight_type: string; title: string; description: string }>
  >([]);
  const [shouldAutoStartVoice, setShouldAutoStartVoice] = useState(false);
  const pendingChatInsightRef = useRef<ChatInsightParam | null>(null);
  const didAutoSendInsightRef = useRef(false);
  const messageClientIdsRef = useRef<Map<string, string | number>>(new Map());

  const voiceInsight = route.params?.voiceInsight;

  const mapChatInsightToContext = useCallback((insight: ChatInsightParam): InsightContext => ({
    insightType: insight.insightType,
    badge: insight.badge,
    title: insight.title,
    contextSummary: insight.contextSummary,
    internalContext: insight.internalContext,
    backgroundType: insight.backgroundType,
  }), []);

  const applyChatInsight = useCallback(
    (insight: ChatInsightParam) => {
      pendingChatInsightRef.current = insight;
      didAutoSendInsightRef.current = false;
      setInsightContext(mapChatInsightToContext(insight));
      setRecentInsights([
        {
          insight_type: insight.insightType,
          title: insight.title,
          description: insight.contextSummary,
        },
      ]);
    },
    [mapChatInsightToContext],
  );

  useEffect(() => {
    if (chatHomeResetToken === 0) return;

    setStreamingMessages([]);
    setIsStreaming(false);
    streamingIdRef.current = null;
    clearMessageClientIds(messageClientIdsRef.current);
    setIsVoiceModeActive(false);
    setIsVoiceConnecting(false);
    setVoiceTranscript('');
    setIsBudSpeaking(false);
    setInsightContext(null);
    setRecentInsights([]);
    setShouldAutoStartVoice(false);
    pendingChatInsightRef.current = null;
    didAutoSendInsightRef.current = false;
    clearPendingChatInsight();
    navigation.setParams({ voiceInsight: undefined, chatInsight: undefined });
    void voiceInterfaceRef.current?.endConversation();
  }, [chatHomeResetToken, navigation]);

  useEffect(() => {
    if (!voiceInsight) return;

    setRecentInsights([
      {
        insight_type: voiceInsight.insight_type,
        title: voiceInsight.title,
        description: voiceInsight.description,
      },
    ]);

    setShouldAutoStartVoice(true);
  }, [voiceInsight]);

  useEffect(() => {
    if (!shouldAutoStartVoice) return;
    if (!currentConversationId) return;

    const start = async () => {
      try {
        await voiceInterfaceRef.current?.startConversation();
      } catch (e) {
        // startConversation already alerts on most failures
      } finally {
        setShouldAutoStartVoice(false);
      }
    };

    void start();
  }, [shouldAutoStartVoice, currentConversationId]);

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
    },
    [currentConversationId, addMessage],
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

      const activeInsightContext = contextOverride ?? insightContext;

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

      await streamChat({
        messages: apiMessages,
        userContext,
        insightContext: activeInsightContext ?? undefined,
        memoryContext: memoryLoading ? undefined : memoryContext,
        approachContext: {
          strategy: approachDecision.strategy,
          guidanceText: approachDecision.guidanceText,
        },
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
    ],
  );

  const trySendPendingInsight = useCallback(() => {
    const pending = pendingChatInsightRef.current;
    if (!pending?.initialUserMessage?.trim()) return;
    if (!currentConversationId) return;
    if (didAutoSendInsightRef.current) return;
    if (isStreaming) return;

    didAutoSendInsightRef.current = true;
    const message = pending.initialUserMessage.trim();
    const context = mapChatInsightToContext(pending);
    pendingChatInsightRef.current = null;

    void handleSendMessage(message, context);
  }, [currentConversationId, handleSendMessage, isStreaming, mapChatInsightToContext]);

  useFocusEffect(
    useCallback(() => {
      const fromParams = route.params?.chatInsight;
      const fromStash = takePendingChatInsight();
      const insight = fromParams ?? fromStash;
      if (!insight) return;

      applyChatInsight(insight);
      if (fromParams) {
        navigation.setParams({ chatInsight: undefined });
      }

      requestAnimationFrame(() => {
        trySendPendingInsight();
      });
    }, [applyChatInsight, navigation, route.params?.chatInsight, trySendPendingInsight]),
  );

  useEffect(() => {
    trySendPendingInsight();
  }, [trySendPendingInsight]);

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View className="flex-1 bg-background">
      <LinearGradient
        colors={[colors['chat-warm-bg'], colors['chat-gradient-end']]}
        locations={[0.35, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <KeyboardAvoidingView
        behavior={PlatformConstants.keyboardBehavior}
        className="flex-1"
        keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
      >
        <TabScreenHeader>
          <WeekCalendarHeader
            leftIcon={Book}
            onPressLeft={() => navigation.navigate('Explore')}
            showLeftIndicatorDot
            rightIcon={Settings}
            onPressRight={() => rootNavigation.navigate('Settings')}
          />
        </TabScreenHeader>
        <ChatContainer
          messages={allMessages}
          loading={isStreaming || messagesLoading}
          topPadding={Spacing.base}
          scrollResetToken={chatHomeResetToken}
          onAssistantRevealComplete={handleAssistantRevealComplete}
        />
        <MessageInputBar
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          voiceAppearance="prominent"
          voiceInterfaceRef={voiceInterfaceRef}
          onVoiceModeChange={setIsVoiceModeActive}
          onVoiceConnectingChange={setIsVoiceConnecting}
          onVoiceUserMessage={handleVoiceUserMessage}
          onVoiceAssistantMessage={handleVoiceAssistantMessage}
          onVoiceTranscript={setVoiceTranscript}
          onSpeakingChange={setIsBudSpeaking}
          userContext={userContext}
          messageHistory={messageHistory}
          recentInsights={recentInsights}
          internalProfile={memoryLoading ? undefined : internalProfileText}
        />
      </KeyboardAvoidingView>
      <VoiceMode
        visible={isVoiceModeActive}
        onClose={() => setIsVoiceModeActive(false)}
        onEndVoice={handleEndVoiceSession}
        transcript={voiceTranscript}
        isBudSpeaking={isBudSpeaking}
        isConnecting={isVoiceConnecting}
      />
      </View>
    </ScreenLoadingGate>
  );
}
