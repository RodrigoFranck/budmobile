import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react-native';

import { useFocusEffect } from '@react-navigation/native';

import { CLICK_EVENTS, logClickEvent } from '@/analytics';
import ConversationDetail from '@/components/history/ConversationDetail';
import { WeekProgressRing } from '@/components/history/WeekProgressRing';
import { DeepInsightSheet } from '@/components/explore/DeepInsightSheet';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import {
  useTabScreenContext,
  useTabScreenLoading,
} from '@/contexts/TabScreenContext';
import { LayoutSpacing } from '@/constants/layout';
import { useAppColors } from '@/lib/colors';
import {
  formatConversationWeekdayLabel,
  groupConversationsByDate,
  groupConversationsByWeek,
} from '@/utils/dateGrouping';
import {
  formatDateBrasilia,
  getWeekStartBrasilia,
} from '@/utils/dateUtils';
import { createHistoryStyles } from '@/pages/History.styles';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';

const inspiredBg = require('@/assets/inspired-bg.png');

type HistoryRouteProp = RouteProp<MainTabParamList, 'History'>;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<HistoryRouteProp>();
  const colors = useAppColors();
  const styles = useMemo(() => createHistoryStyles(colors), [colors]);
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

  const weekGroups = useMemo(
    () => groupConversationsByWeek(conversations),
    [conversations],
  );

  useEffect(() => {
    if (selectedWeekIndex >= weekGroups.length && weekGroups.length > 0) {
      setSelectedWeekIndex(0);
    }
  }, [weekGroups.length, selectedWeekIndex]);

  const currentWeek = weekGroups[selectedWeekIndex];
  const weekConversations = useMemo(() => {
    if (!currentWeek) {
      return [];
    }
    return groupConversationsByDate(currentWeek.conversations).flatMap(
      (group) => group.conversations,
    );
  }, [currentWeek]);

  const canGoNewer = selectedWeekIndex > 0;
  const canGoOlder = selectedWeekIndex < weekGroups.length - 1;
  const canOpenDeepInsight = !insightsLoading && !deepInsightProgress.locked;
  const showInsightCard = !currentWeek || currentWeek.isCurrent;
  const remainingDays = deepInsightProgress.remaining;
  const meetsWeeklyThreshold =
    deepInsightProgress.progress >= deepInsightProgress.required;
  const progressMessage = meetsWeeklyThreshold
    ? 'Você já tem dias suficientes nesta semana.\nSeu insight semanal libera todo domingo.'
    : `Converse ou faça check-ins em mais ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'} nesta semana\npara receber seu insight semanal.`;

  useEffect(() => {
    if (!route.params?.openDeepInsight) {
      return;
    }

    const weekStart = route.params.weekStart;
    if (weekStart) {
      setInsightWeekStart(weekStart);
      setForceOpenDeepInsight(true);
    }

    setPendingDeepInsightOpen(true);
    navigation.setParams({ openDeepInsight: undefined, weekStart: undefined });
  }, [navigation, route.params?.openDeepInsight, route.params?.weekStart]);

  useEffect(() => {
    if (!insightWeekStart || weekGroups.length === 0) {
      return;
    }

    const matchingIndex = weekGroups.findIndex(
      (group) => formatDateBrasilia(group.weekStart) === insightWeekStart,
    );
    if (matchingIndex >= 0 && matchingIndex !== selectedWeekIndex) {
      setSelectedWeekIndex(matchingIndex);
    }
  }, [insightWeekStart, selectedWeekIndex, weekGroups]);

  useEffect(() => {
    if (!pendingDeepInsightOpen) {
      return;
    }

    if (!forceOpenDeepInsight && !canOpenDeepInsight) {
      return;
    }

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
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + LayoutSpacing.contentPadding.top,
              paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
              paddingBottom: LayoutSpacing.contentPadding.bottom + insets.bottom,
            },
          ]}
        >
          {currentWeek ? (
            <View style={styles.weekHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Semana anterior"
                disabled={!canGoOlder}
                onPress={() => setSelectedWeekIndex((i) => i + 1)}
                style={[styles.weekNavButton, !canGoOlder && styles.weekNavButtonDisabled]}
              >
                <ChevronLeft size={20} color={colors.foreground} />
              </Pressable>

              <Text style={styles.weekLabel}>{currentWeek.weekLabel}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima semana"
                disabled={!canGoNewer}
                onPress={() => setSelectedWeekIndex((i) => i - 1)}
                style={[styles.weekNavButton, !canGoNewer && styles.weekNavButtonDisabled]}
              >
                <ChevronRight size={20} color={colors.foreground} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.headerDivider} />

          {showInsightCard ? (
            <View
              style={[
                styles.inspiredCard,
                canOpenDeepInsight
                  ? styles.inspiredCardAvailable
                  : styles.inspiredCardProgress,
              ]}
            >
              <ImageBackground
                source={inspiredBg}
                style={styles.inspiredImage}
                imageStyle={styles.inspiredImageRadius}
                resizeMode="cover"
              >
                <View style={styles.inspiredOverlay} />
                <View
                  style={[
                    styles.inspiredContent,
                    canOpenDeepInsight && styles.inspiredContentAvailable,
                  ]}
                >
                  <View style={styles.inspiredBadge}>
                    {canOpenDeepInsight ? (
                      <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                    ) : null}
                    <Text
                      style={[
                        styles.inspiredBadgeText,
                        canOpenDeepInsight && styles.inspiredBadgeTextAvailable,
                      ]}
                    >
                      Inspirado em você
                    </Text>
                  </View>

                  {insightsLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : canOpenDeepInsight ? (
                    <>
                      <Text style={styles.inspiredTitle}>
                        {deepInsight.title || 'Inspirado em você'}
                      </Text>
                      <Text style={styles.inspiredDescription}>
                        {deepInsight.description ||
                          'Baseado nas suas conversas desta semana, o Bud identificou um padrão.'}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clique aqui para ver mais"
                        onPress={openDeepInsight}
                        style={styles.inspiredCta}
                      >
                        <Text style={styles.inspiredCtaText}>Clique aqui para ver mais</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={styles.progressRingWrap}>
                        <WeekProgressRing
                          progress={deepInsightProgress.progress}
                          required={deepInsightProgress.required}
                        />
                      </View>
                      <Text style={styles.inspiredProgressMessage}>{progressMessage}</Text>
                      <Text style={styles.inspiredReleaseText}>
        Libera domingo, 9h da manhã
                      </Text>
                    </>
                  )}
                </View>
              </ImageBackground>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Conversas da semana</Text>

          {weekConversations.length === 0 ? (
            conversations.length === 0 ? (
              <View style={styles.emptyCard}>
                <MessageSquare size={48} color={colors['muted-foreground']} />
                <Text style={styles.emptyText}>Você ainda não tem conversas salvas.</Text>
              </View>
            ) : (
              <View style={styles.emptyWeek}>
                <Text style={styles.emptyWeekText}>Nenhuma conversa nesta semana.</Text>
              </View>
            )
          ) : (
            weekConversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                accessibilityRole="button"
                accessibilityLabel={`Conversa: ${conversation.title}`}
                onPress={() => openConversation(conversation)}
                style={styles.conversationRow}
              >
                <View style={styles.conversationTextWrap}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text style={styles.conversationDate}>
                    {formatConversationWeekdayLabel(conversation.date)}
                  </Text>
                </View>
                <Text style={styles.conversationChevron}>›</Text>
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
            insightWeekStart ??
            formatDateBrasilia(currentWeek?.weekStart ?? getWeekStartBrasilia())
          }
        />
      </View>
    </ScreenLoadingGate>
  );
}
