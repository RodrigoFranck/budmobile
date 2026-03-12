import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserPlan } from '@/hooks/useUserPlan';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { streamChat, type UserContext } from '@/utils/chatStream';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { StreamingMessage } from '@/types/messages';
import { PlatformConstants } from '@/constants/layout';
import {
  VoiceInterfaceRef,
} from '@/voice/VoiceInterface';
import { VoiceMode } from '@/voice/VoiceMode';

export default function ChatScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { canSendMessage, incrementMessageCount } = useUserPlan();
  const { getOrCreateTodayConversation } = useConversations();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);
  const voiceInterfaceRef = useRef<VoiceInterfaceRef>(null);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isBudSpeaking, setIsBudSpeaking] = useState(false);

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

  const allMessages = useMemo(() => {
    const dbMessagesFormatted = dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
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
    async (message: string) => {
      if (!canSendMessage) {
        alert('Você atingiu o limite de mensagens do plano gratuito.');
        return;
      }

      if (!currentConversationId || !user) return;

      const userMessageId = `user-${Date.now()}`;
      setStreamingMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: message,
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
        },
      ]);

      let accumulatedContent = '';

      await streamChat({
        messages: apiMessages,
        userContext,
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

          setStreamingMessages([]);

          incrementMessageCount();
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
      canSendMessage,
      currentConversationId,
      user,
      dbMessages,
      userContext,
      incrementMessageCount,
      addMessage,
    ],
  );

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <KeyboardAvoidingView
        behavior={PlatformConstants.keyboardBehavior}
        className="flex-1"
        keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
      >
        <ChatContainer
          messages={allMessages}
          loading={isStreaming || messagesLoading}
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
