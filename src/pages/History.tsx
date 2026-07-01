import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Lock, MessageSquare, Sparkles } from 'lucide-react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import ConversationDetail from '@/components/history/ConversationDetail';
import { DeepInsightSheet } from '@/components/explore/DeepInsightSheet';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import {
  useTabScreenContext,
  useTabScreenLoading,
} from '@/contexts/TabScreenContext';
import { LayoutSpacing } from '@/constants/layout';
import { useAppColors } from '@/lib/colors';
import { groupConversationsByDate, groupConversationsByMonth } from '@/utils/dateGrouping';
import { createHistoryStyles } from '@/pages/History.styles';

const inspiredBg = require('@/assets/inspired-bg.png');

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const styles = useMemo(() => createHistoryStyles(colors), [colors]);
  const tabLoading = useTabScreenLoading('History');
  const {
    conversations,
    generalInsight,
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
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [deepInsightOpen, setDeepInsightOpen] = useState(false);

  const monthGroups = useMemo(
    () => groupConversationsByMonth(conversations),
    [conversations],
  );

  useEffect(() => {
    if (selectedMonthIndex >= monthGroups.length && monthGroups.length > 0) {
      setSelectedMonthIndex(0);
    }
  }, [monthGroups.length, selectedMonthIndex]);

  const currentMonth = monthGroups[selectedMonthIndex];
  const groupedByDate = useMemo(
    () => (currentMonth ? groupConversationsByDate(currentMonth.conversations) : []),
    [currentMonth],
  );

  const canGoNewer = selectedMonthIndex > 0;
  const canGoOlder = selectedMonthIndex < monthGroups.length - 1;

  const canOpenDeepInsight = !insightsLoading && !deepInsightProgress.locked;

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
        <Text style={styles.pageTitle} accessibilityRole="header">
          Histórico
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            canOpenDeepInsight
              ? 'Inspirado em você. Toque para ler o insight completo.'
              : 'Inspirado em você. Continue conversando para desbloquear.'
          }
          onPress={() => {
            if (canOpenDeepInsight) {
              setDeepInsightOpen(true);
            }
          }}
          disabled={!canOpenDeepInsight}
          style={styles.inspiredCard}
        >
          <ImageBackground source={inspiredBg} style={{ flex: 1 }} resizeMode="cover">
            <View style={styles.inspiredOverlay} />
            <View style={styles.inspiredContent}>
              <View style={styles.inspiredBadgeRow}>
                <Sparkles size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.inspiredBadge}>Inspirado em você</Text>
              </View>

              {insightsLoading ? (
                <ActivityIndicator color="#ffffff" style={{ alignSelf: 'flex-start' }} />
              ) : canOpenDeepInsight ? (
                <>
                  <Text style={styles.inspiredTitle} numberOfLines={2}>
                    {generalInsight.locked
                      ? 'Inspirado em você'
                      : generalInsight.title}
                  </Text>
                  <Text style={styles.inspiredDescription} numberOfLines={2}>
                    {generalInsight.locked
                      ? 'Toque para ler seu insight semanal.'
                      : generalInsight.description}
                  </Text>
                  <View style={styles.inspiredHintRow}>
                    <Text style={styles.inspiredHint}>Toque para ler</Text>
                    <ChevronRight size={14} color="rgba(255,255,255,0.5)" />
                  </View>
                </>
              ) : (
                <View style={styles.inspiredLockedRow}>
                  <Lock size={20} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.inspiredLockedText}>
                    Continue conversando com o Bud para desbloquear seu insight semanal (
                    {deepInsightProgress.progress}/{deepInsightProgress.required} conversas nesta
                    semana).
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </Pressable>

        {conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <MessageSquare size={48} color={colors['muted-foreground']} />
            <Text style={styles.emptyText}>Você ainda não tem conversas salvas.</Text>
          </View>
        ) : (
          <>
            {currentMonth ? (
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mês anterior"
                  disabled={!canGoOlder}
                  onPress={() => setSelectedMonthIndex((i) => i + 1)}
                  style={[styles.monthNavButton, !canGoOlder && styles.monthNavButtonDisabled]}
                >
                  <ChevronLeft size={22} color={colors.foreground} />
                </Pressable>

                <View>
                  <Text style={styles.monthLabel}>{currentMonth.monthLabel}</Text>
                  <Text style={styles.monthCount}>
                    {currentMonth.count}{' '}
                    {currentMonth.count === 1 ? 'conversa' : 'conversas'}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Próximo mês"
                  disabled={!canGoNewer}
                  onPress={() => setSelectedMonthIndex((i) => i - 1)}
                  style={[styles.monthNavButton, !canGoNewer && styles.monthNavButtonDisabled]}
                >
                  <ChevronRight size={22} color={colors.foreground} />
                </Pressable>
              </View>
            ) : null}

            {groupedByDate.length === 0 ? (
              <View style={styles.emptyMonth}>
                <Text style={styles.emptyMonthText}>Nenhuma conversa neste mês.</Text>
              </View>
            ) : (
              groupedByDate.map((group) => (
                <View key={group.groupKey} style={styles.dateGroup}>
                  <Text style={styles.dateGroupTitle}>{group.groupTitle}</Text>

                  {group.conversations.map((conversation) => (
                    <Pressable
                      key={conversation.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Conversa: ${conversation.title}`}
                      onPress={() =>
                        setSelectedConversation({
                          id: conversation.id,
                          title: conversation.title,
                          date: conversation.date.toISOString(),
                        })
                      }
                      style={styles.conversationRow}
                    >
                      <Text style={styles.conversationTitle} numberOfLines={1}>
                        {conversation.title}
                      </Text>
                      <ChevronRight size={20} color={colors['muted-foreground']} />
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <DeepInsightSheet visible={deepInsightOpen} onClose={() => setDeepInsightOpen(false)} />
      </View>
    </ScreenLoadingGate>
  );
}
