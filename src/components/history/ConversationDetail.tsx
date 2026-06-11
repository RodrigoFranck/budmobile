import React, { useEffect, useMemo, useState } from 'react';
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
import {
  generateConversationTitle,
  needsConversationTitleRegeneration,
} from '@/utils/generateConversationTitle';

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
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!needsConversationTitleRegeneration(conversationTitle)) {
      setGeneratedTitle(null);
      return;
    }

    let cancelled = false;

    generateConversationTitle(conversationId)
      .then((title) => {
        if (!cancelled && title) {
          setGeneratedTitle(title);
        }
      })
      .catch(() => {
        // Mantém fallback de data enquanto a IA não responde.
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, conversationTitle]);

  const displayTitle = useMemo(() => {
    if (!needsConversationTitleRegeneration(conversationTitle)) {
      return conversationTitle;
    }

    if (generatedTitle) {
      return generatedTitle;
    }

    return format(new Date(conversationDate), "d 'de' MMMM", { locale: ptBR });
  }, [conversationTitle, conversationDate, generatedTitle]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  const formattedDate = format(new Date(conversationDate), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

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
          <Text style={styles.backLabel}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {displayTitle}
        </Text>
        <Text style={styles.subtitle}>{formattedDate}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
                    <View style={styles.userMeta}>
                      <Text style={styles.roleLabel}>Você</Text>
                      <Text style={styles.timeLabel}>
                        {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                      </Text>
                    </View>
                    <View style={styles.userBubble}>
                      <Text style={styles.userBody}>{message.content}</Text>
                    </View>
                  </View>
                ) : message.role === 'assistant' ? (
                  <View style={styles.assistantWrap}>
                    <View style={styles.assistantMeta}>
                      <Text style={styles.roleLabel}>Bud.</Text>
                      <Text style={styles.timeLabel}>
                        {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                      </Text>
                    </View>
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
