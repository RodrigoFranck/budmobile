import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { streamChat, type InsightContext, type UserContext } from '@/utils/chatStream';
import type { ChatInsightParam } from '@/types/chatInsight';
import { takePendingChatInsight } from '@/utils/navigateToChat';
import type { StreamingMessage } from '@/types/messages';
import { PlatformConstants } from '@/constants/layout';
import {
  VoiceInterfaceRef,
} from '@/voice/VoiceInterface';
import { VoiceMode } from '@/voice/VoiceMode';
import { useAppColors } from '@/lib/colors';
import type { MainTabNavigationProp, MainTabParamList, RootNavigationProp } from '@/types/navigation';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { Spacing } from '@/constants/styles';

export default function ChatScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { getOrCreateTodayConversation } = useConversations();
  const insets = useSafeAreaInsets();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);
  const voiceInterfaceRef = useRef<VoiceInterfaceRef>(null);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
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

  const { messages: dbMessages, loading: messagesLoading, addMessage } =
    useMessages(currentConversationId);

  useEffect(() => {
    if (!user) return;

    const initConversation = async () => {
      const conversation = await getOrCreateTodayConversation();
      if (conversation) {
        setCurrentConversationId(conversation.id);
      }
    };
    initConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
      if (streamMsg.isStreaming) return false;
      if (!streamMsg.content.trim()) return false;

      return dbMessages.some(
        (dbMsg) => dbMsg.role === streamMsg.role && dbMsg.content === streamMsg.content,
      );
    });

    if (allStreamingInDb) {
      setStreamingMessages([]);
    }
  }, [dbMessages, streamingMessages]);

  const allMessages = useMemo(() => {
    const dbMessagesFormatted = dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
      createdAt: msg.created_at,
    }));

    const dbContents = new Set(dbMessages.map((m) => `${m.role}:${m.content}`));
    const filteredStreaming = streamingMessages.filter(
      (msg) => !dbContents.has(`${msg.role}:${msg.content}`) || msg.isStreaming,
    );

    return [...dbMessagesFormatted, ...filteredStreaming];
  }, [dbMessages, streamingMessages]);

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

  const handleSendMessage = useCallback(
    async (message: string, contextOverride?: InsightContext | null) => {
      if (!currentConversationId || !user) return;

      const activeInsightContext = contextOverride ?? insightContext;

      const userMessageId = `user-${Date.now()}`;
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

      await streamChat({
        messages: apiMessages,
        userContext,
        insightContext: activeInsightContext ?? undefined,
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
          setIsStreaming(false);
          setStreamingMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
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
        <View style={{ paddingTop: insets.top + Spacing.base, paddingHorizontal: Spacing.base + 4 }}>
          <WeekCalendarHeader
            leftIcon={Book}
            onPressLeft={() => navigation.navigate('Explore')}
            showLeftIndicatorDot
            rightIcon={Settings}
            onPressRight={() => rootNavigation.navigate('Settings')}
          />
        </View>
        <ChatContainer
          messages={allMessages}
          loading={isStreaming || messagesLoading}
          topPadding={Spacing.base}
        />
        <MessageInputBar
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          voiceInterfaceRef={voiceInterfaceRef}
          onVoiceModeChange={setIsVoiceModeActive}
          onVoiceUserMessage={handleVoiceUserMessage}
          onVoiceAssistantMessage={handleVoiceAssistantMessage}
          onVoiceTranscript={setVoiceTranscript}
          onSpeakingChange={setIsBudSpeaking}
          userContext={userContext}
          messageHistory={messageHistory}
          recentInsights={recentInsights}
        />
      </KeyboardAvoidingView>
      <VoiceMode
        visible={isVoiceModeActive}
        onClose={() => setIsVoiceModeActive(false)}
        onEndVoice={handleEndVoiceSession}
        transcript={voiceTranscript}
        isBudSpeaking={isBudSpeaking}
      />
    </View>
  );
}
