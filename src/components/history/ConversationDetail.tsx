import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';

interface ConversationDetailProps {
  conversationId: string;
  conversationTitle: string;
  conversationDate: string;
  onBack: () => void;
}

export default function ConversationDetail({
  conversationId,
  conversationTitle,
  conversationDate,
  onBack,
}: ConversationDetailProps) {
  const { messages, loading } = useMessages(conversationId);
  const headerHeight = useHeaderHeight();

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header />
        <Sidebar />
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Carregando...</Text>
        </View>
      </View>
    );
  }

  const formattedDate = format(new Date(conversationDate), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      
      {/* Header Fixo - Botão Voltar */}
      <View style={{ paddingTop: headerHeight + 16, paddingHorizontal: 16, paddingBottom: 16 }}>
        <Button
          variant="ghost"
          onPress={onBack}
          className="self-start"
        >
          <Text>← Voltar</Text>
        </Button>
      </View>

      {/* Título Fixo */}
      <View className="px-6 py-4">
        <Text className="text-3xl font-semibold text-foreground mb-2">
          {conversationTitle}
        </Text>
        <Text className="text-sm text-muted-foreground capitalize">
          {formattedDate}
        </Text>
      </View>

      {/* Área de Scroll Suave */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-muted-foreground text-center">
              Nenhuma mensagem encontrada nesta conversa.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {messages.map((message) => (
              <View key={message.id} className="w-full py-2">
                {message.role === 'context' ? (
                  (() => {
                    try {
                      const contextData = JSON.parse(message.content);
                      return (
                        <View className="bg-muted/50 rounded-lg px-4 py-3">
                          <Text className="text-xs font-semibold text-muted-foreground mb-1">
                            {contextData.badge}
                          </Text>
                          <Text className="text-base font-semibold text-foreground mb-1">
                            {contextData.title}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {contextData.description}
                          </Text>
                        </View>
                      );
                    } catch {
                      return (
                        <View className="flex justify-center">
                          <View className="bg-muted/50 rounded-lg px-4 py-2">
                            <Text className="text-sm text-muted-foreground text-center">
                              {message.content}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  })()
                ) : (
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

