import { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, MessageSquare, Share2 } from 'lucide-react-native';

import { CLICK_EVENTS, logClickEvent } from '@/analytics';
import ConversationDetail from '@/components/history/ConversationDetail';
import { WeekProgressRing } from '@/components/history/WeekProgressRing';
import { DeepInsightSheet } from '@/components/explore/DeepInsightSheet';
import { BudIconButton } from '@/components/v3';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { useTabScreenContext, useTabScreenLoading } from '@/contexts/TabScreenContext';
import {
  formatConversationWeekdayLabel,
  groupConversationsByDate,
  groupConversationsByWeek,
} from '@/utils/dateGrouping';
import { formatDateBrasilia, getWeekStartBrasilia } from '@/utils/dateUtils';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';

type HistoryRouteProp = RouteProp<MainTabParamList, 'History'>;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<HistoryRouteProp>();
  const colors = useV3Colors();
  const tabLoading = useTabScreenLoading('History');
  const {
    conversations,
    deepInsight,
    deepInsightProgress,
    insightsLoading,
    refreshExploreInsights,
  } = useTabScreenContext();

  useFocusEffect(
    useCallback(() => {
      refreshExploreInsights({ cacheOnly: true });
    }, [refreshExploreInsights]),
  );

  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
    date: string;
  } | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [deepInsightOpen, setDeepInsightOpen] = useState(false);
  const [pendingDeepInsightOpen, setPendingDeepInsightOpen] = useState(false);
  const [forceOpenDeepInsight, setForceOpenDeepInsight] = useState(false);
  const [insightWeekStart, setInsightWeekStart] = useState<string | null>(null);

  const openDeepInsight = useCallback(() => {
    void logClickEvent(CLICK_EVENTS.HISTORY_DEEP_INSIGHT_OPEN);
    setDeepInsightOpen(true);
  }, []);

  const shareWeek = useCallback(async () => {
    const title = deepInsight.title || 'Resumo da semana com o Bud';
    const body = deepInsight.description || 'Uma semana de conversas com o Bud.';
    await Share.share({ message: `${title}\n\n${body}` });
  }, [deepInsight.description, deepInsight.title]);

  const openConversation = useCallback(
    (conversation: { id: string; title: string; date: Date }) => {
      void logClickEvent(CLICK_EVENTS.HISTORY_CONVERSATION_OPEN);
      setSelectedConversation({
        id: conversation.id,
        title: conversation.title,
        date: conversation.date.toISOString(),
      });
    },
    [],
  );

  const weekGroups = useMemo(() => groupConversationsByWeek(conversations), [conversations]);

  useEffect(() => {
    if (selectedWeekIndex >= weekGroups.length && weekGroups.length > 0) {
      setSelectedWeekIndex(0);
    }
  }, [weekGroups.length, selectedWeekIndex]);

  const currentWeek = weekGroups[selectedWeekIndex];
  const weekConversations = useMemo(() => {
    if (!currentWeek) return [];
    return groupConversationsByDate(currentWeek.conversations).flatMap((group) => group.conversations);
  }, [currentWeek]);

  const canGoNewer = selectedWeekIndex > 0;
  const canGoOlder = selectedWeekIndex < weekGroups.length - 1;
  const canOpenDeepInsight = !insightsLoading && !deepInsightProgress.locked;
  const showInsightCard = !currentWeek || currentWeek.isCurrent;
  const remainingDays = deepInsightProgress.remaining;
  const meetsWeeklyThreshold = deepInsightProgress.progress >= deepInsightProgress.required;
  const progressMessage = meetsWeeklyThreshold
    ? 'Você já tem dias suficientes nesta semana.\nSeu insight semanal libera todo domingo.'
    : `Converse ou faça check-ins em mais ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'} nesta semana\npara receber seu insight semanal.`;

  useEffect(() => {
    if (!route.params?.openDeepInsight) return;
    const weekStart = route.params.weekStart;
    if (weekStart) {
      setInsightWeekStart(weekStart);
      setForceOpenDeepInsight(true);
    }
    setPendingDeepInsightOpen(true);
    navigation.setParams({ openDeepInsight: undefined, weekStart: undefined });
  }, [navigation, route.params?.openDeepInsight, route.params?.weekStart]);

  useEffect(() => {
    if (!insightWeekStart || weekGroups.length === 0) return;
    const matchingIndex = weekGroups.findIndex(
      (group) => formatDateBrasilia(group.weekStart) === insightWeekStart,
    );
    if (matchingIndex >= 0 && matchingIndex !== selectedWeekIndex) {
      setSelectedWeekIndex(matchingIndex);
    }
  }, [insightWeekStart, selectedWeekIndex, weekGroups]);

  useEffect(() => {
    if (!pendingDeepInsightOpen) return;
    if (!forceOpenDeepInsight && !canOpenDeepInsight) return;
    setDeepInsightOpen(true);
    setPendingDeepInsightOpen(false);
    setForceOpenDeepInsight(false);
  }, [canOpenDeepInsight, forceOpenDeepInsight, pendingDeepInsightOpen]);

  if (selectedConversation) {
    return (
      <ConversationDetail
        conversationId={selectedConversation.id}
        conversationTitle={selectedConversation.title}
        conversationDate={selectedConversation.date}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <BudIconButton
            icon={ChevronLeft}
            accessibilityLabel="Voltar"
            onPress={() => navigation.navigate('Home')}
          />
          {canOpenDeepInsight ? (
            <BudIconButton
              icon={Share2}
              accessibilityLabel="Compartilhar resumo da semana"
              onPress={() => void shareWeek()}
            />
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40 + insets.bottom,
          }}
        >
          {currentWeek ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Semana anterior"
                disabled={!canGoOlder}
                onPress={() => setSelectedWeekIndex((i) => i + 1)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: canGoOlder ? 1 : 0.35,
                }}
              >
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.display,
                  fontSize: 22,
                  color: colors.text,
                  textAlign: 'center',
                }}
              >
                {currentWeek.weekLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima semana"
                disabled={!canGoNewer}
                onPress={() => setSelectedWeekIndex((i) => i - 1)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: canGoNewer ? 1 : 0.35,
                }}
              >
                <ChevronRight size={20} color={colors.text} />
              </Pressable>
            </View>
          ) : null}

          {showInsightCard ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 22,
                padding: 22,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                {canOpenDeepInsight ? <Check size={14} color={colors.accent} strokeWidth={2.5} /> : null}
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 11,
                    letterSpacing: 1.4,
                    color: colors.text3,
                    textTransform: 'uppercase',
                  }}
                >
                  Inspirado em você
                </Text>
              </View>
              {insightsLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : canOpenDeepInsight ? (
                <>
                  <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text }}>
                    {deepInsight.title || 'Inspirado em você'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 15,
                      lineHeight: 22,
                      color: colors.text2,
                      marginTop: 10,
                    }}
                  >
                    {deepInsight.description ||
                      'Baseado nas suas conversas desta semana, o Bud identificou um padrão.'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openDeepInsight}
                    style={{ marginTop: 16 }}
                  >
                    <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, color: colors.accent }}>
                      Ler o resumo da semana
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <WeekProgressRing
                    progress={deepInsightProgress.progress}
                    required={deepInsightProgress.required}
                    trackColor={colors.line}
                    progressColor={colors.accent}
                    labelColor={colors.text}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.text2,
                      textAlign: 'center',
                      marginTop: 14,
                    }}
                  >
                    {progressMessage}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sansSemi,
                      fontSize: 12,
                      color: colors.accent,
                      marginTop: 10,
                    }}
                  >
                    Libera domingo, 9h da manhã
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: 16 }}>
            Conversas da semana
          </Text>

          {weekConversations.length === 0 ? (
            conversations.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  paddingVertical: 48,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                }}
              >
                <MessageSquare size={48} color={colors.text3} />
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    color: colors.text2,
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  Você ainda não tem conversas salvas.
                </Text>
              </View>
            ) : (
              <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.text2, textAlign: 'center' }}>
                Nenhuma conversa nesta semana.
              </Text>
            )
          ) : (
            weekConversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                accessibilityRole="button"
                accessibilityLabel={`Conversa: ${conversation.title}`}
                onPress={() => openConversation(conversation)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  minHeight: 64,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.text }}
                    numberOfLines={1}
                  >
                    {conversation.title}
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text2, marginTop: 2 }}>
                    {formatConversationWeekdayLabel(conversation.date)}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 22, color: colors.text3 }}>›</Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <DeepInsightSheet
          visible={deepInsightOpen}
          onClose={() => {
            setDeepInsightOpen(false);
            setInsightWeekStart(null);
          }}
          weekStart={
            insightWeekStart ?? formatDateBrasilia(currentWeek?.weekStart ?? getWeekStartBrasilia())
          }
        />
      </View>
    </ScreenLoadingGate>
  );
}
