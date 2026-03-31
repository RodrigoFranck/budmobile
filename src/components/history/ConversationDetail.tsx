import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessages } from '@/hooks/useMessages';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react-native';

import { useOnboardingColors } from '@/constants/onboardingTheme';
import { useConversationDetailStyles } from '@/components/history/ConversationDetail.styles';

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
  const insets = useSafeAreaInsets();
  const onboardingColors = useOnboardingColors();
  const styles = useConversationDetailStyles();

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  const dateObj = new Date(conversationDate);
  const formattedDate = format(dateObj, "d 'de' MMMM", { locale: ptBR });

  return (
    <View style={styles.screen}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 18 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          activeOpacity={0.85}
          onPress={onBack}
          style={styles.backButton}
        >
          <ChevronLeft size={18} color={onboardingColors.textTaupe} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{conversationTitle}</Text>
        <Text style={styles.subtitle}>{formattedDate}</Text>
      </View>

      {/* Área de Scroll Suave */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhuma mensagem encontrada nesta conversa.
            </Text>
          </View>
        ) : (
          <View style={styles.messages}>
            {messages.map((message, index) => (
              <View
                key={`message-${conversationId}-${message.id}-${message.created_at}-${index}`}
                style={styles.messageRow}
              >
                {message.role === 'context' ? (
                  (() => {
                    try {
                      const contextData = JSON.parse(message.content);
                      return (
                        <View style={styles.contextCard}>
                          <Text style={styles.contextBadge}>
                            {contextData.badge}
                          </Text>
                          <Text style={styles.contextTitle}>
                            {contextData.title}
                          </Text>
                          <Text style={styles.contextDescription}>
                            {contextData.description}
                          </Text>
                        </View>
                      );
                    } catch {
                      return (
                        <View style={styles.contextFallbackWrap}>
                          <View style={styles.contextFallbackCard}>
                            <Text style={styles.contextFallbackText}>
                              {message.content}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  })()
                ) : message.role === 'user' || message.role === 'assistant' ? (
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// styles moved to ConversationDetail.styles.ts



