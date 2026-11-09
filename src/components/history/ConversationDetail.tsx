import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';

import { InsightContextCard } from '@/components/chat/InsightContextCard';
import { ChatPhoto } from '@/components/chat/ChatPhoto';
import { useHistoryDayMessages } from '@/hooks/useHistoryDayMessages';
import { useOnboardingColors } from '@/constants/onboardingTheme';
import { useConversationDetailStyles } from '@/components/history/ConversationDetail.styles';
import type { HistoryActivityChip } from '@/hooks/useHistoryDays';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import type { InsightActivityType } from '@/utils/insightContextVariant';
import {
  isUserMessageAfterContext,
  parseInsightContextMessage,
} from '@/utils/insightContextMessage';
import { parseChatImageContent } from '@/utils/chatImageMessage';

interface ConversationDetailProps {
  conversationId: string | null;
  conversationTitle: string;
  conversationDate: string;
  weekdayLabel?: string;
  dateLabel?: string;
  activities?: HistoryActivityChip[];
  hasLetter?: boolean;
  onBack: () => void;
}

function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toInsightActivityType(id: ActivityId): InsightActivityType {
  if (id === 'ordenacao_valores') return 'valores';
  return id;
}

export default function ConversationDetail({
  conversationId,
  conversationDate,
  weekdayLabel: weekdayLabelProp,
  dateLabel: dateLabelProp,
  activities = [],
  hasLetter = false,
  onBack,
}: ConversationDetailProps) {
  const { messages, loading, isFetching, hasMore, loadMore, isFetchingMore } =
    useHistoryDayMessages(conversationId);
  const insets = useSafeAreaInsets();
  const onboardingColors = useOnboardingColors();
  const styles = useConversationDetailStyles();

  const weekdayLabel = useMemo(() => {
    if (weekdayLabelProp) return weekdayLabelProp;
    const raw = format(new Date(conversationDate), 'EEEE', { locale: ptBR });
    return capitalizeFirst(raw);
  }, [conversationDate, weekdayLabelProp]);

  const dateLabel = useMemo(() => {
    if (dateLabelProp) return dateLabelProp;
    return format(new Date(conversationDate), "d 'de' MMMM", { locale: ptBR });
  }, [conversationDate, dateLabelProp]);

  const activityTypesShown = useMemo(
    () => new Set(activities.map((activity) => toInsightActivityType(activity.id))),
    [activities],
  );

  const hasMessages = messages.length > 0;
  const showEmpty =
    !loading && !hasMessages && activities.length === 0 && !hasLetter;
  const showSoftLoading = loading || (isFetching && !hasMessages);

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
          <ChevronLeft size={20} color={onboardingColors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          if (!hasMore || isFetchingMore) return;
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const nearBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
          if (nearBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={200}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.weekday} accessibilityRole="header">
            {weekdayLabel}
          </Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {showSoftLoading ? (
          <View style={styles.inlineLoading} accessibilityLabel="Carregando conversa">
            <ActivityIndicator color={onboardingColors.accent} />
            <Text style={styles.inlineLoadingText}>Carregando…</Text>
          </View>
        ) : null}

        {activities.length > 0 ? (
          <View style={styles.activitiesBlock}>
            <Text style={styles.activitiesTitle}>Atividades</Text>
            {activities.map((activity) => (
              <InsightContextCard
                key={activity.id}
                badge={`${activity.label} · Resultado`}
                title={activity.resultText?.trim() || activity.label}
                description={
                  activity.resultText?.trim()
                    ? undefined
                    : 'Você fez esta atividade neste dia.'
                }
                variant="activity"
                activityType={toInsightActivityType(activity.id)}
              />
            ))}
          </View>
        ) : null}

        {hasLetter && !hasMessages && !showSoftLoading ? (
          <View style={styles.letterNote}>
            <Text style={styles.letterNoteText}>Você abriu a carta deste dia.</Text>
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={onboardingColors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma mensagem encontrada nesta conversa.</Text>
          </View>
        ) : null}

        {hasMessages ? (
          <View style={styles.messages}>
            {messages.map((message, index) => {
              if (isUserMessageAfterContext(messages, index)) {
                return null;
              }

              return (
                <View
                  key={`message-${conversationId}-${message.id}-${message.created_at}-${index}`}
                  style={styles.messageRow}
                >
                  {message.role === 'context' ? (
                    (() => {
                      const contextData = parseInsightContextMessage(message.content);
                      if (
                        contextData?.activityType &&
                        activityTypesShown.has(contextData.activityType)
                      ) {
                        return null;
                      }
                      if (contextData) {
                        return (
                          <InsightContextCard
                            badge={contextData.badge}
                            title={contextData.title}
                            description={contextData.description}
                            variant={contextData.variant}
                            activityType={contextData.activityType}
                          />
                        );
                      }

                      return (
                        <View style={styles.contextFallbackWrap}>
                          <View style={styles.contextFallbackCard}>
                            <Text style={styles.contextFallbackText}>{message.content}</Text>
                          </View>
                        </View>
                      );
                    })()
                  ) : message.role === 'user' ? (
                    <View style={styles.userWrap}>
                      <Text style={styles.roleLabelUser}>Você</Text>
                      {(() => {
                        const storagePath =
                          parseChatImageContent(message.content)?.storagePath ?? null;
                        const inlineUri = message.content.startsWith('data:image/')
                          ? message.content
                          : null;
                        if (storagePath || inlineUri) {
                          return (
                            <View style={styles.userPhotoBubble}>
                              <ChatPhoto
                                uri={inlineUri}
                                storagePath={inlineUri ? null : storagePath}
                                style={styles.userPhoto}
                              />
                            </View>
                          );
                        }
                        return <Text style={styles.userBody}>{message.content}</Text>;
                      })()}
                    </View>
                  ) : message.role === 'assistant' ? (
                    <View style={styles.assistantWrap}>
                      <Text style={styles.roleLabelBud}>Bud.</Text>
                      <Text style={styles.assistantBody}>{message.content}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {isFetchingMore ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={onboardingColors.accent} />
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
