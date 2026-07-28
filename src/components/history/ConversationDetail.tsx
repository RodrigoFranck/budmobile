import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';

import { InsightContextCard } from '@/components/chat/InsightContextCard';
import type { InsightContextBackgroundType } from '@/components/chat/InsightContextCard';
import { useMessages } from '@/hooks/useMessages';
import { useOnboardingColors } from '@/constants/onboardingTheme';
import { useConversationDetailStyles } from '@/components/history/ConversationDetail.styles';

interface ConversationDetailProps {
  conversationId: string;
  conversationTitle: string;
  conversationDate: string;
  onBack: () => void;
}

function parseContextBackgroundType(value: unknown): InsightContextBackgroundType {
  if (
    value === 'yesterday' ||
    value === 'inspired' ||
    value === 'frequency' ||
    value === 'habit'
  ) {
    return value;
  }
  return 'inspired';
}

function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ConversationDetail({
  conversationId,
  conversationDate,
  onBack,
}: ConversationDetailProps) {
  const { messages, loading } = useMessages(conversationId);
  const insets = useSafeAreaInsets();
  const onboardingColors = useOnboardingColors();
  const styles = useConversationDetailStyles();

  const weekdayLabel = useMemo(() => {
    const raw = format(new Date(conversationDate), 'EEEE', { locale: ptBR });
    return capitalizeFirst(raw);
  }, [conversationDate]);

  const dateLabel = useMemo(() => {
    return format(new Date(conversationDate), "d 'de' MMMM", { locale: ptBR });
  }, [conversationDate]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

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
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleBlock}>
          <Text style={styles.weekday} accessibilityRole="header">
            {weekdayLabel}
          </Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={onboardingColors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma mensagem encontrada nesta conversa.</Text>
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
                        <InsightContextCard
                          badge={contextData.badge}
                          title={contextData.title}
                          description={contextData.description}
                          backgroundType={parseContextBackgroundType(contextData.backgroundType)}
                        />
                      );
                    } catch {
                      return (
                        <View style={styles.contextFallbackWrap}>
                          <View style={styles.contextFallbackCard}>
                            <Text style={styles.contextFallbackText}>{message.content}</Text>
                          </View>
                        </View>
                      );
                    }
                  })()
                ) : message.role === 'user' ? (
                  <View style={styles.userWrap}>
                    <Text style={styles.roleLabelUser}>Você</Text>
                    <Text style={styles.userBody}>{message.content}</Text>
                  </View>
                ) : message.role === 'assistant' ? (
                  <View style={styles.assistantWrap}>
                    <Text style={styles.roleLabelBud}>Bud.</Text>
                    <Text style={styles.assistantBody}>{message.content}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
