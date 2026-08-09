import { useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Book, Settings } from 'lucide-react-native';
import type { Insight } from '@/hooks/useExploreInsights';
import { buildExploreChatInsight } from '@/utils/buildExploreChatInsight';
import { navigateToChatTab } from '@/utils/navigateToChat';
import { InsightCard } from '@/components/explore/InsightCard';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import {
  useTabScreenContext,
  useTabScreenLoading,
} from '@/contexts/TabScreenContext';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';
import { LayoutSpacing, ExploreGradientColors } from '@/constants/layout';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function ExploreScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const { mode } = useTheme();
  const tabLoading = useTabScreenLoading('Explore');
  const {
    yesterdayInsight,
    frequencyInsight,
    habitInsight,
    refreshExploreInsights,
  } = useTabScreenContext();

  useFocusEffect(
    useCallback(() => {
      refreshExploreInsights({ cacheOnly: true });
    }, [refreshExploreInsights]),
  );

  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ExploreGradientColors.animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: ExploreGradientColors.animationDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  const navigateToChatText = (insightType: string, insight: Insight) => {
    if (insight.locked) {
      return;
    }

    navigateToChatTab(navigation, {
      chatInsight: buildExploreChatInsight(insightType, insight, 'text'),
    });
  };

  const navigateToChatVoice = (insightType: string, insight: Insight) => {
    if (insight.locked) {
      return;
    }

    navigateToChatTab(navigation, {
      chatInsight: buildExploreChatInsight(insightType, insight, 'voice'),
    });
  };

  const handleContinueYesterday = () => {
    navigateToChatText('yesterday_journey', yesterdayInsight);
  };

  const handleTalkAboutFrequency = () => {
    navigateToChatText('frequency', frequencyInsight);
  };

  const handleStartHabit = () => {
    navigateToChatText('habit', habitInsight);
  };

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={{ flex: 1 }}>
      <LinearGradient
        colors={mode === 'dark' ? ExploreGradientColors.dark.base : ExploreGradientColors.light.base}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: opacityAnim,
        }}
      >
        <LinearGradient
          colors={mode === 'dark' ? ExploreGradientColors.dark.animated : ExploreGradientColors.light.animated}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
        style={{ flex: 1, zIndex: 1 }}
      >
        <TabScreenHeader>
          <WeekCalendarHeader
            leftIcon={Book}
            onPressLeft={() => navigation.navigate('Explore')}
            showLeftIndicatorDot
            rightIcon={Settings}
            onPressRight={() => rootNavigation.navigate('Settings')}
          />
        </TabScreenHeader>

        <View
          style={{
            paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
            paddingTop: 16,
            gap: 16,
          }}
        >
          <InsightCard
            badge="SUA JORNADA DE ONTEM"
            title={yesterdayInsight.title}
            description={yesterdayInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleContinueYesterday}
            locked={yesterdayInsight.locked}
            remaining={yesterdayInsight.remaining}
            cycleProgress={yesterdayInsight.cycleProgress}
            cycleRequired={yesterdayInsight.cycleRequired}
            onMicClick={() => navigateToChatVoice('yesterday_journey', yesterdayInsight)}
            micDisabled={yesterdayInsight.locked}
          />

          <InsightCard
            badge="SUA FREQUÊNCIA"
            title={frequencyInsight.title}
            description={frequencyInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleTalkAboutFrequency}
            locked={frequencyInsight.locked}
            remaining={frequencyInsight.remaining}
            cycleProgress={frequencyInsight.cycleProgress}
            cycleRequired={frequencyInsight.cycleRequired}
            onMicClick={() => navigateToChatVoice('frequency', frequencyInsight)}
            micDisabled={frequencyInsight.locked}
          />

          <InsightCard
            badge="CONSTRUA UM HÁBITO"
            title={habitInsight.title}
            description={habitInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleStartHabit}
            locked={habitInsight.locked}
            remaining={habitInsight.remaining}
            cycleProgress={habitInsight.cycleProgress}
            cycleRequired={habitInsight.cycleRequired}
            onMicClick={() => navigateToChatVoice('habit', habitInsight)}
            micDisabled={habitInsight.locked}
          />
        </View>
      </ScrollView>
      </View>
    </ScreenLoadingGate>
  );
}
