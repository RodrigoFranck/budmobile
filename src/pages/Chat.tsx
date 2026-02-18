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

  const { messages: dbMessages, loading: messagesLoading, addMessage } = useMessages(currentConversationId);

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

  // Memoizar a combinação de mensagens para evitar recálculos desnecessários
  // Filtra streamingMessages que já aparecem no dbMessages (evita duplicatas)
  const allMessages = useMemo(() => {
    const dbMessagesFormatted = dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
    }));
    
    // Só incluir streaming messages que ainda não foram salvas no banco
    // (identifica pela combinação de role + content)
    const dbContents = new Set(dbMessages.map((m) => `${m.role}:${m.content}`));
    const filteredStreaming = streamingMessages.filter(
      (msg) => !dbContents.has(`${msg.role}:${msg.content}`) || msg.isStreaming
    );
    
    return [...dbMessagesFormatted, ...filteredStreaming];
  }, [dbMessages, streamingMessages]);

  // Memoizar userContext para evitar recriação a cada render
  const userContext = useMemo<UserContext>(() => {
    // Determinar se é a primeira interação do dia (baseado nas mensagens da conversa de hoje)
    const todayMessages = dbMessages.filter(msg => 
      msg.conversation_id === currentConversationId
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

  const handleSendMessage = useCallback(async (message: string) => {
    if (!canSendMessage) {
      alert('Você atingiu o limite de mensagens do plano gratuito.');
      return;
    }

    if (!currentConversationId || !user) return;

    // Add user message to streaming (ADICIONAR ao invés de substituir)
    const userMessageId = `user-${Date.now()}`;
    setStreamingMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: message,
      },
    ]);

    // Save user message to database
    const userMessagePromise = addMessage(message, 'user');

    // Prepare messages for API - usar apenas mensagens do banco (já salvas)
    const apiMessages = [
      ...dbMessages
        .filter((m) => m.role !== 'context' || !m.role) // Filtrar context se necessário
        .map((m) => ({
          role: (m.role === 'context' ? 'user' : m.role) as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user' as const, content: message },
    ];

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
        // Usar função de atualização para evitar dependências
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
        
        // Save messages to database
        await userMessagePromise;
        await addMessage(accumulatedContent, 'assistant');
        
        // Clear streaming messages since they're now in DB
        setStreamingMessages([]);
        
        incrementMessageCount();
      },
      onError: (error) => {
        setIsStreaming(false);
        alert(`Erro: ${error}`);
        setStreamingMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        streamingIdRef.current = null;
      },
    });
  }, [canSendMessage, currentConversationId, user, dbMessages, userContext, incrementMessageCount, addMessage]);

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

