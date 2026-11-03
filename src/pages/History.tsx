import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  groupHistoryDaysByWeek,
  historyDayIsOpenable,
  useHistoryDays,
  type HistoryDay,
  type HistoryWeekSection,
  type HistoryWeekTitle,
} from '@/hooks/useHistoryDays';
import { clearMissingRelation } from '@/lib/schemaAvailability';
import {
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

type HistoryRouteProp = RouteProp<MainTabParamList, 'History'>;

type DayListItem = { kind: 'day'; day: HistoryDay };
type RecapListItem = { kind: 'recap' };
type SectionListItem = DayListItem | RecapListItem;

type HistoryListSection = {
  key: string;
  title: HistoryWeekTitle;
  weekStart: Date;
  weekEnd: Date;
  data: SectionListItem[];
};

function remainingDaysCopy(days: number) {
  if (days <= 0) return 'Cada conversa desta semana entra nele.';
  const lead = days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`;
  return `${lead}. Cada conversa desta semana entra nele.`;
}

function dayAccessibilityLabel(day: HistoryDay) {
  const parts = [day.weekdayLabel, day.dateLabel];
  if (day.messageCount > 0) {
    parts.push(`${day.messageCount} trocas`);
  }
  if (day.hasLetter) {
    parts.push('carta');
  }
  for (const activity of day.activities) {
    parts.push(activity.label);
  }
  return parts.join(', ');
}

function WeekSectionTitle({ title }: { title: HistoryWeekTitle }) {
  const colors = useV3Colors();
  if (title.kind === 'this_week') {
    return <AccentTitle before="Esta " accent="semana" size={26} lineHeight={32} />;
  }
  if (title.kind === 'last_week') {
    return (
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text },
        ]}
      >
        Semana{' '}
        <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic' }}>passada</Text>
      </Text>
    );
  }
  return <Text style={[styles.sectionTitle, { color: colors.text }]}>{title.label}</Text>;
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
      <View style={styles.dayActions}>
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

  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);
  const [recapWeekStart, setRecapWeekStart] = useState<string | null>(null);

  const firstName = profile?.name?.split(' ')[0] ?? 'você';
  const recapUnlocked = !insightsLoading && !deepInsightProgress.locked;
  const remainingDays = daysUntilSunday();
  const weekRange = formatWeekRangeLong(weekStart, weekEnd);
  const currentWeekKey = formatDateBrasilia(weekStart);
  const fallbackThemes = useMemo(
    () =>
      (internalProfile?.recurring_themes ?? [])
        .map((theme) => theme.theme?.trim())
        .filter((theme): theme is string => Boolean(theme)),
    [internalProfile?.recurring_themes],
  );

  const weekSections = useMemo(() => groupHistoryDaysByWeek(days), [days]);

  const listSections = useMemo<HistoryListSection[]>(() => {
    const grouped = new Map(weekSections.map((section) => [section.key, section]));
    const ensureCurrent = (): HistoryWeekSection => {
      const existing = grouped.get(currentWeekKey);
      if (existing) return existing;
      return {
        key: currentWeekKey,
        weekStart,
        weekEnd,
        title: { kind: 'this_week' },
        days: [],
      };
    };

    const orderedKeys = Array.from(
      new Set([currentWeekKey, ...weekSections.map((section) => section.key)]),
    ).sort((a, b) => b.localeCompare(a));

    return orderedKeys.map((key) => {
      const section = key === currentWeekKey ? ensureCurrent() : grouped.get(key)!;
      const data: SectionListItem[] =
        key === currentWeekKey
          ? [{ kind: 'recap' }, ...section.days.map((day) => ({ kind: 'day' as const, day }))]
          : section.days.map((day) => ({ kind: 'day' as const, day }));

      return {
        key: section.key,
        title: section.title,
        weekStart: section.weekStart,
        weekEnd: section.weekEnd,
        data,
      };
    });
  }, [currentWeekKey, weekEnd, weekSections, weekStart]);

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

  const openRecap = useCallback(
    (weekStartKey = currentWeekKey) => {
      if (weekStartKey === currentWeekKey && !recapUnlocked) return;
      void logClickEvent(CLICK_EVENTS.HISTORY_DEEP_INSIGHT_OPEN);
      setRecapWeekStart(weekStartKey);
    },
    [currentWeekKey, recapUnlocked],
  );

  const openDay = useCallback((day: HistoryDay) => {
    if (!historyDayIsOpenable(day)) return;
    void logClickEvent(CLICK_EVENTS.HISTORY_CONVERSATION_OPEN);
    setSelectedDay(day);
  }, []);

  useEffect(() => {
    if (!route.params?.openDeepInsight) return;
    const targetWeek = route.params.weekStart ?? currentWeekKey;
    setRecapWeekStart(targetWeek);
    navigation.setParams({ openDeepInsight: undefined, weekStart: undefined });
  }, [currentWeekKey, navigation, route.params?.openDeepInsight, route.params?.weekStart]);

  if (selectedDay) {
    return (
      <ConversationDetail
        conversationId={selectedDay.conversationId}
        conversationTitle={selectedDay.conversationTitle}
        conversationDate={selectedDay.conversationDate}
        weekdayLabel={selectedDay.weekdayLabel}
        dateLabel={selectedDay.dateLabel}
        activities={selectedDay.activities}
        hasLetter={selectedDay.hasLetter}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  if (recapWeekStart) {
    return (
      <WeekRecapView
        weekStart={recapWeekStart}
        firstName={firstName}
        weekDots={weekDots}
        conversationDays={conversationDaysThisWeek}
        fallbackThemes={fallbackThemes}
        onBack={() => setRecapWeekStart(null)}
      />
    );
  }

  const renderRecapCard = () =>
    recapUnlocked ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver resumo da semana"
        onPress={() => openRecap(currentWeekKey)}
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
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>pronta</Text>
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
          <Text style={[styles.lockedKicker, { color: colors.text3 }]}>Resumo da semana</Text>
        </View>
        <Text style={[styles.lockedTitle, { color: colors.text }]}>
          Chega domingo às{' '}
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>17h</Text>
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
    );

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

        <SectionList
          sections={listSections}
          keyExtractor={(item, index) =>
            item.kind === 'day' ? item.day.dateKey : `recap-${index}`
          }
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
          renderSectionHeader={({ section }) => {
            const isFirst = section.key === listSections[0]?.key;
            return (
              <View
                style={[
                  styles.sectionHeader,
                  {
                    backgroundColor: colors.bg,
                    paddingTop: isFirst ? 12 : 24,
                  },
                ]}
              >
                <WeekSectionTitle title={section.title} />
              </View>
            );
          }}
          renderItem={({ item, index, section }) => {
            if (item.kind === 'recap') {
              return <View style={styles.recapWrap}>{renderRecapCard()}</View>;
            }
            const firstDayIndex = section.data.findIndex((entry) => entry.kind === 'day');
            return (
              <View style={index === firstDayIndex ? styles.dayListStart : undefined}>
                <DayRow day={item.day} onPress={() => openDay(item.day)} />
              </View>
            );
          }}
        />
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
  sectionHeader: {
    paddingBottom: 0,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  recapWrap: {
    paddingTop: 16,
  },
  dayListStart: {
    paddingTop: 8,
  },
  lockedCard: {
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
  dayRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
  },
  dayText: {
    flex: 1,
    minWidth: 0,
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
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
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
  letterChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
