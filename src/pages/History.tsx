import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { CLICK_EVENTS, logClickEvent } from '@/analytics';
import ConversationDetail from '@/components/history/ConversationDetail';
import { BudIconButton } from '@/components/v3';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { useTabScreenContext, useTabScreenLoading } from '@/contexts/TabScreenContext';
import {
  daysUntilSunday,
  formatWeekRangeLong,
  useHistoryDays,
  type HistoryDay,
} from '@/hooks/useHistoryDays';
import { clearMissingRelation } from '@/lib/schemaAvailability';
import {
  HistoryChatFillIcon,
  HistoryChevronIcon,
  HistoryEnvelopeIcon,
  HistoryLockIcon,
  HistoryMessageIcon,
} from '@/pages/history/historyIcons';
import WeekRecapView from '@/pages/history/WeekRecapView';
import { AccentTitle } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';
import { formatDateBrasilia } from '@/utils/dateUtils';
import { navigateToChatTab } from '@/utils/navigateToChat';

type HistoryRouteProp = RouteProp<MainTabParamList, 'History'>;

function remainingDaysCopy(days: number) {
  if (days <= 0) return 'Cada conversa desta semana entra nele.';
  const lead = days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`;
  return `${lead}. Cada conversa desta semana entra nele.`;
}

function dayAccessibilityLabel(day: HistoryDay) {
  const parts = [day.weekdayLabel, day.dateLabel];
  for (const activity of day.activities) {
    parts.push(activity.label);
  }
  if (day.messageCount > 0) {
    parts.push(`${day.messageCount} trocas`);
  }
  if (day.hasLetter) {
    parts.push('carta');
  }
  return parts.join(', ');
}

function DayRow({
  day,
  onPress,
}: {
  day: HistoryDay;
  onPress: () => void;
}) {
  const colors = useV3Colors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dayAccessibilityLabel(day)}
      onPress={onPress}
      style={[styles.dayRow, { borderBottomColor: colors.line }]}
    >
      <View style={styles.dayText}>
        <Text numberOfLines={1} style={[styles.dayWeekday, { color: colors.text }]}>
          {day.weekdayLabel}
        </Text>
        <Text numberOfLines={1} style={[styles.dayDate, { color: colors.text3 }]}>
          {day.dateLabel}
        </Text>
      </View>
      <View style={styles.dayChips}>
        {day.activities.map((activity) => (
          <View
            key={activity.id}
            style={[styles.chip, { backgroundColor: colors.surface2, gap: 8 }]}
          >
            <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
            <Text style={[styles.chipLabel, { color: colors.text }]}>{activity.label}</Text>
          </View>
        ))}
        {day.messageCount > 0 ? (
          <View style={[styles.chip, { backgroundColor: colors.surface2, gap: 6 }]}>
            <HistoryMessageIcon color={colors.text} />
            <Text style={[styles.chipLabel, { color: colors.text }]}>{day.messageCount}</Text>
          </View>
        ) : null}
        {day.hasLetter ? (
          <View style={[styles.letterChip, { backgroundColor: colors.accent }]}>
            <HistoryEnvelopeIcon color={colors.onAccent} />
          </View>
        ) : null}
      </View>
      <View style={styles.dayChevron}>
        <HistoryChevronIcon color={colors.text3} />
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<HistoryRouteProp>();
  const colors = useV3Colors();
  const assets = useV3Asset();
  const tabLoading = useTabScreenLoading('History');
  const {
    conversations,
    profile,
    internalProfile,
    deepInsightProgress,
    insightsLoading,
    refreshExploreInsights,
    refetchConversations,
  } = useTabScreenContext();
  const {
    days,
    weekDots,
    weekStart,
    weekEnd,
    conversationDaysThisWeek,
    refetch: refetchHistoryDays,
  } = useHistoryDays(conversations);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    title: string;
    date: string;
  } | null>(null);
  const [recapOpen, setRecapOpen] = useState(false);

  const firstName = profile?.name?.split(' ')[0] ?? 'você';
  const recapUnlocked = !insightsLoading && !deepInsightProgress.locked;
  const remainingDays = daysUntilSunday();
  const weekRange = formatWeekRangeLong(weekStart, weekEnd);
  const fallbackThemes = useMemo(
    () =>
      (internalProfile?.recurring_themes ?? [])
        .map((theme) => theme.theme?.trim())
        .filter((theme): theme is string => Boolean(theme)),
    [internalProfile?.recurring_themes],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearMissingRelation('activity_sessions');
    clearMissingRelation('daily_letters');
    try {
      await Promise.all([
        refetchConversations(),
        refetchHistoryDays(),
        refreshExploreInsights({ cacheOnly: true }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchConversations, refetchHistoryDays, refreshExploreInsights]);

  useFocusEffect(
    useCallback(() => {
      refreshExploreInsights({ cacheOnly: true });
    }, [refreshExploreInsights]),
  );

  const openRecap = useCallback(() => {
    if (!recapUnlocked) return;
    void logClickEvent(CLICK_EVENTS.HISTORY_DEEP_INSIGHT_OPEN);
    setRecapOpen(true);
  }, [recapUnlocked]);

  const openDay = useCallback((day: HistoryDay) => {
    if (!day.conversationId) return;
    void logClickEvent(CLICK_EVENTS.HISTORY_CONVERSATION_OPEN);
    setSelectedConversation({
      id: day.conversationId,
      title: day.conversationTitle,
      date: day.conversationDate,
    });
  }, []);

  useEffect(() => {
    if (!route.params?.openDeepInsight) return;
    setRecapOpen(true);
    navigation.setParams({ openDeepInsight: undefined, weekStart: undefined });
  }, [navigation, route.params?.openDeepInsight, route.params?.weekStart]);

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

  if (recapOpen) {
    return (
      <WeekRecapView
        weekStart={formatDateBrasilia(weekStart)}
        firstName={firstName}
        weekDots={weekDots}
        conversationDays={conversationDaysThisWeek}
        fallbackThemes={fallbackThemes}
        onBack={() => setRecapOpen(false)}
      />
    );
  }

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <BudIconButton
            icon={ChevronLeft}
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
          />
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.text }]}>
            Histórico
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          <View style={styles.body}>
            <AccentTitle before="Esta " accent="semana" size={26} lineHeight={32} />

            {recapUnlocked ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver resumo da semana"
                onPress={openRecap}
                style={[
                  styles.unlockedCard,
                  { backgroundColor: colors.surface, borderColor: colors.accent },
                ]}
              >
                <View style={[styles.novo, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.novoLabel, { color: colors.onAccent }]}>Novo</Text>
                </View>
                <Text style={[styles.unlockedTitle, { color: colors.text, maxWidth: 220 }]}>
                  Sua semana está{' '}
                  <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>
                    pronta
                  </Text>
                </Text>
                <Text style={[styles.unlockedBody, { color: colors.text2 }]}>
                  De {weekRange}. O Bud juntou o que mais apareceu nas suas conversas.
                </Text>
                <View style={[styles.verResumo, { backgroundColor: colors.btn }]}>
                  <Text style={[styles.verResumoLabel, { color: colors.onBtn }]}>Ver resumo</Text>
                </View>
                <Image
                  source={assets.historyCalendarGiz}
                  style={styles.calendarUnlocked}
                  resizeMode="contain"
                />
              </Pressable>
            ) : (
              <View style={[styles.lockedCard, { backgroundColor: colors.surface }]}>
                <View style={styles.lockedKickerRow}>
                  <HistoryLockIcon color={colors.text3} />
                  <Text style={[styles.lockedKicker, { color: colors.text3 }]}>
                    Resumo da semana
                  </Text>
                </View>
                <Text style={[styles.lockedTitle, { color: colors.text }]}>
                  Chega domingo às{' '}
                  <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>
                    17h
                  </Text>
                </Text>
                <Text style={[styles.lockedBody, { color: colors.text2 }]}>
                  {remainingDaysCopy(remainingDays)}
                </Text>
                <View style={styles.dotsRow}>
                  {weekDots.map((dot, index) => (
                    <View key={`${dot.label}-${index}`} style={styles.dotCol}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: dot.active ? colors.accent : 'transparent',
                            borderColor: dot.active ? colors.accent : colors.line,
                          },
                        ]}
                      />
                      <Text style={[styles.dotLabel, { color: colors.text3 }]}>{dot.label}</Text>
                    </View>
                  ))}
                </View>
                <Image
                  source={assets.historyCalendarGiz}
                  style={styles.calendarLocked}
                  resizeMode="contain"
                />
                <Image
                  source={assets.historyCalendarMarks}
                  style={styles.calendarLocked}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.dayList}>
              {days.map((day) => (
                <DayRow key={day.dateKey} day={day} onPress={() => openDay(day)} />
              ))}
            </View>
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chat"
          onPress={() => navigateToChatTab(navigation, {})}
          style={[styles.chatFab, { backgroundColor: colors.accent, bottom: insets.bottom + 16 }]}
        >
          <HistoryChatFillIcon color={colors.onAccent} />
          <Text style={[styles.chatFabLabel, { color: colors.onAccent }]}>Chat</Text>
        </Pressable>
      </View>
    </ScreenLoadingGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 56,
    marginTop: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  lockedCard: {
    marginTop: 16,
    height: 202,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  lockedKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedKicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  lockedTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginTop: 12,
    maxWidth: 250,
  },
  lockedBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 250,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  dotCol: {
    width: 26,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  dotLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    lineHeight: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  calendarLocked: {
    position: 'absolute',
    top: 18,
    right: 12,
    width: 84,
    height: 84,
    opacity: 0.6,
  },
  unlockedCard: {
    marginTop: 16,
    minHeight: 266,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  novo: {
    alignSelf: 'flex-start',
    height: 26,
    borderRadius: 20,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  novoLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    lineHeight: 12,
  },
  unlockedTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginTop: 12,
  },
  unlockedBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 240,
  },
  verResumo: {
    marginTop: 14,
    width: 150,
    height: 42,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verResumoLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    lineHeight: 15,
  },
  calendarUnlocked: {
    position: 'absolute',
    top: 18,
    right: 16,
    width: 84,
    height: 84,
  },
  dayList: {
    marginTop: 8,
  },
  dayRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
  },
  dayText: {
    flexShrink: 0,
  },
  dayWeekday: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 17,
  },
  dayDate: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13,
    marginTop: 6,
  },
  dayChips: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    overflow: 'hidden',
  },
  dayChevron: {
    flexShrink: 0,
  },
  chip: {
    height: 34,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 14,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  letterChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFab: {
    position: 'absolute',
    right: 22,
    height: 56,
    paddingLeft: 20,
    paddingRight: 24,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  chatFabLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
});
