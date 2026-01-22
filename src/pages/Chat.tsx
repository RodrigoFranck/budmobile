import { useState, useEffect, useRef } from 'react';
import { View, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserPlan } from '@/hooks/useUserPlan';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { streamChat, type UserContext } from '@/utils/chatStream';
import { getTodayInBrasilia } from '@/utils/dateUtils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { StreamingMessage } from '@/types/messages';
import { PlatformConstants } from '@/constants/layout';

export default function ChatScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { canSendMessage, incrementMessageCount } = useUserPlan();
  const { getOrCreateTodayConversation } = useConversations();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);

  const { messages: dbMessages, loading: messagesLoading } = useMessages(currentConversationId);

  // Get or create conversation on mount
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

  // Combine DB messages with streaming messages
  const allMessages = [
    ...dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
    })),
    ...streamingMessages,
  ];

  const handleSendMessage = async (message: string) => {
    if (!canSendMessage) {
      alert('Você atingiu o limite de mensagens do plano gratuito.');
      return;
    }

    if (!currentConversationId || !user) return;

    // Add user message to streaming
    const userMessageId = `user-${Date.now()}`;
    setStreamingMessages([
      {
        id: userMessageId,
        role: 'user',
        content: message,
      },
    ]);

    // Create user context
    const userContext: UserContext = {
      name: profile?.name || null,
      initialThoughts: profile?.initial_thoughts || null,
      conversationGoal: profile?.conversation_goal || null,
      occupation: profile?.occupation || null,
      age: profile?.age || null,
      gender: profile?.gender || null,
      relationship: profile?.relationship || null,
      hobbies: profile?.hobbies || null,
      isFirstInteractionOfDay: getTodayInBrasilia() === new Date().toISOString().split('T')[0],
    };

    // Prepare messages for API
    const apiMessages = allMessages
      .filter((m) => !('isStreaming' in m && m.isStreaming))
      .map((m) => ({
        role: m.role === 'context' ? 'user' as const : m.role,
        content: m.content,
      }));

    apiMessages.push({ role: 'user' as const, content: message });

    // Start streaming
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
      onDone: () => {
        setIsStreaming(false);
        setStreamingMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
        streamingIdRef.current = null;
        incrementMessageCount();
      },
      onError: (error) => {
        setIsStreaming(false);
        alert(`Erro: ${error}`);
        setStreamingMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        streamingIdRef.current = null;
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <KeyboardAvoidingView
        behavior={PlatformConstants.keyboardBehavior}
        className="flex-1"
        keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
      >
        <ChatContainer messages={allMessages} loading={isStreaming || messagesLoading} />
        <MessageInputBar onSendMessage={handleSendMessage} disabled={isStreaming} />
      </KeyboardAvoidingView>
    </View>
  );
}

