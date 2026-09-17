import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { ACTION_EVENTS, CLICK_EVENTS, logActionEvent, logClickEvent } from '@/analytics';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { Book, Settings } from 'lucide-react-native';
import { Easing, useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination, type CarouselRef } from 'react-native-reanimated-carousel';
import type { Insight } from '@/hooks/useExploreInsights';
import { openExploreChat } from '@/utils/buildExploreChatInsight';
import { InsightCard } from '@/components/explore/InsightCard';
import { InsightNavControls } from '@/components/explore/InsightNavControls';
import {
  INSIGHT_CARD_SIDE_INSET,
  insightPaginationStyles,
} from '@/components/explore/InsightCard.styles';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import {
  useTabScreenContext,
  useTabScreenLoading,
} from '@/contexts/TabScreenContext';
import { useAppColors } from '@/lib/colors';
import type {
  MainTabNavigationProp,
  RootNavigationProp,
} from '@/types/navigation';
import {
  EXPLORE_INSIGHT_COUNT,
  EXPLORE_INSIGHT_KEYS,
  type ExploreInsightKey,
} from '@/constants/exploreInsights';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';

type ExploreCardItem = {
  key: ExploreInsightKey;
  badge: string;
  insight: Insight;
};

function clampInsightIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }
  return Math.min(length - 1, Math.max(0, index));
}

const ExploreInsightSlide = memo(function ExploreInsightSlide({
  item,
  width,
  height,
  onMessage,
  onVoice,
}: {
  item: ExploreCardItem;
  width: number;
  height: number;
  onMessage: (key: ExploreInsightKey, insight: Insight) => void;
  onVoice: (key: ExploreInsightKey, insight: Insight) => void;
}) {
  return (
    <View
      style={{
        width,
        height,
        paddingLeft: INSIGHT_CARD_SIDE_INSET,
        paddingRight: INSIGHT_CARD_SIDE_INSET,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      <InsightCard
        category={item.key}
        badge={item.badge}
        title={item.insight.title}
        description={item.insight.description}
        buttonText="Envie uma mensagem"
        onButtonClick={() => onMessage(item.key, item.insight)}
        locked={item.insight.locked}
        remaining={item.insight.remaining}
        cycleProgress={item.insight.cycleProgress}
        cycleRequired={item.insight.cycleRequired}
        onMicClick={() => onVoice(item.key, item.insight)}
        micDisabled={item.insight.locked}
        fillParent
      />
    </View>
  );
});

export default function ExploreScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const colors = useAppColors();
  const isFocused = useIsFocused();
  const tabLoading = useTabScreenLoading('Explore');
  const {
    yesterdayInsight,
    frequencyInsight,
    habitInsight,
    refreshExploreInsights,
    markInsightViewed,
  } = useTabScreenContext();

  const carouselRef = useRef<CarouselRef>(null);
  const progress = useSharedValue(0);
  const lastLoggedInsightIndexRef = useRef<number | null>(null);
  const [pageHeight, setPageHeight] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const insightCards = useMemo<ExploreCardItem[]>(
    () => [
      {
        key: 'yesterday_journey',
        badge: 'SUA JORNADA DE ONTEM',
        insight: yesterdayInsight,
      },
      {
        key: 'frequency',
        badge: 'SUA FREQUÊNCIA',
        insight: frequencyInsight,
      },
      {
        key: 'habit',
        badge: 'CONSTRUA UM HÁBITO',
        insight: habitInsight,
      },
    ],
    [frequencyInsight, habitInsight, yesterdayInsight],
  );

  const logInsightViewed = useCallback(
    (index: number, interaction: 'swipe' | 'pagination' | 'initial') => {
      const clamped = clampInsightIndex(index, EXPLORE_INSIGHT_COUNT);
      if (lastLoggedInsightIndexRef.current === clamped) {
        return;
      }

      lastLoggedInsightIndexRef.current = clamped;
      const key = EXPLORE_INSIGHT_KEYS[clamped];
      const insight = insightCards[clamped]?.insight;
      if (!key || !insight) {
        return;
      }

      void logActionEvent(ACTION_EVENTS.EXPLORE_INSIGHT_VIEWED, {
        insight_type: key,
        card_index: clamped,
        is_locked: insight.locked ? 'true' : 'false',
        view_method: interaction,
      });
      markInsightViewed(key);
    },
    [insightCards, markInsightViewed],
  );

  const logBlockedInsightAttempt = useCallback(
    (insightType: ExploreInsightKey, insight: Insight, interaction: 'message' | 'voice') => {
      void logActionEvent(ACTION_EVENTS.EXPLORE_INSIGHT_BLOCKED, {
        insight_type: insightType,
        interaction,
        cycle_progress: insight.cycleProgress ?? 0,
        cycle_required: insight.cycleRequired ?? 0,
        remaining: insight.remaining ?? 0,
      });
    },
    [],
  );

  const navigateToChatText = useCallback(
    (insightType: ExploreInsightKey, insight: Insight) => {
      if (insight.locked) {
        logBlockedInsightAttempt(insightType, insight, 'message');
        return;
      }

      void logClickEvent(CLICK_EVENTS.EXPLORE_INSIGHT_MESSAGE, {
        insight_type: insightType,
      });
      openExploreChat(navigation, insightType, insight, 'text');
    },
    [logBlockedInsightAttempt, navigation],
  );

  const navigateToChatVoice = useCallback(
    (insightType: ExploreInsightKey, insight: Insight) => {
      if (insight.locked) {
        logBlockedInsightAttempt(insightType, insight, 'voice');
        return;
      }

      void logClickEvent(CLICK_EVENTS.EXPLORE_INSIGHT_VOICE, {
        insight_type: insightType,
      });
      openExploreChat(navigation, insightType, insight, 'voice');
    },
    [logBlockedInsightAttempt, navigation],
  );

  useFocusEffect(
    useCallback(() => {
      refreshExploreInsights({ cacheOnly: true });
      lastLoggedInsightIndexRef.current = null;
      const currentIndex = carouselRef.current?.getCurrentIndex() ?? 0;
      logInsightViewed(currentIndex, 'initial');
    }, [logInsightViewed, refreshExploreInsights]),
  );

  const handleListLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setPageHeight(height);
    setPageWidth(width);
  };

  const handleSnapToItem = useCallback(
    (index: number) => {
      if (!isFocused) {
        return;
      }
      logInsightViewed(index, 'swipe');
    },
    [isFocused, logInsightViewed],
  );

  const goToInsight = useCallback((index: number) => {
    const clamped = clampInsightIndex(index, EXPLORE_INSIGHT_COUNT);
    const current = carouselRef.current?.getCurrentIndex() ?? 0;
    if (clamped === current) {
      return;
    }
    logInsightViewed(clamped, 'pagination');
    carouselRef.current?.scrollTo({
      index: clamped,
      animated: true,
    });
  }, [logInsightViewed]);

  const handlePrev = useCallback(() => {
    const current = carouselRef.current?.getCurrentIndex() ?? 0;
    goToInsight(current - 1);
  }, [goToInsight]);

  const handleNext = useCallback(() => {
    const current = carouselRef.current?.getCurrentIndex() ?? 0;
    goToInsight(current + 1);
  }, [goToInsight]);

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={{ flex: 1, backgroundColor: colors['chat-warm-bg'] }}>
        <TabScreenHeader>
          <WeekCalendarHeader
            leftIcon={Book}
            onPressLeft={() => navigation.navigate('Explore')}
            showLeftIndicatorDot
            rightIcon={Settings}
            onPressRight={() => rootNavigation.navigate('Settings')}
          />
        </TabScreenHeader>

        <View style={{ flex: 1 }} onLayout={handleListLayout}>
            {pageHeight > 0 && pageWidth > 0 ? (
              <Carousel
                ref={carouselRef}
                data={insightCards}
                keyExtractor={(item) => item.key}
                orientation="vertical"
                loop={false}
                snapMode="page"
                overscrollEnabled={false}
                style={{ width: pageWidth, height: pageHeight }}
                itemSize={pageHeight}
                progress={progress}
                onSnapToItem={handleSnapToItem}
                animation={{
                  type: 'timing',
                  duration: 280,
                  easing: Easing.out(Easing.cubic),
                }}
                renderItem={({ item }) => (
                  <ExploreInsightSlide
                    item={item}
                    width={pageWidth}
                    height={pageHeight}
                    onMessage={navigateToChatText}
                    onVoice={navigateToChatVoice}
                  />
                )}
              />
            ) : null}

            <View style={insightPaginationStyles.rail} pointerEvents="box-none">
              <Pagination
                count={EXPLORE_INSIGHT_COUNT}
                progress={progress}
                orientation="vertical"
                onPress={goToInsight}
                containerStyle={{ gap: 8 }}
                dotStyle={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${colors['chat-body']}47`,
                }}
                activeDotStyle={{
                  width: 6,
                  height: 18,
                  borderRadius: 3,
                  backgroundColor: colors['chat-body'],
                }}
              />
            </View>
          </View>

          <InsightNavControls
            progress={progress}
            onPrev={handlePrev}
            onNext={handleNext}
          />
      </View>
    </ScreenLoadingGate>
  );
}
