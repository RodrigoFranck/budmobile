import { useEffect, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Book, Settings } from 'lucide-react-native';
import type { Insight } from '@/hooks/useExploreInsights';
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
    generalInsight,
    frequencyInsight,
    habitInsight,
  } = useTabScreenContext();

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

  const navigateToChatVoice = (insightType: string, insight: Insight) => {
    navigation.navigate('Chat', {
      voiceInsight: {
        insight_type: insightType,
        title: insight.title,
        description: insight.description,
      },
    });
  };

  const handleContinueYesterday = () => {
    navigation.navigate('Chat');
  };

  const handleTalkAboutInsight = () => {
    navigation.navigate('Chat');
  };

  const handleTalkAboutFrequency = () => {
    navigation.navigate('Chat');
  };

  const handleStartHabit = () => {
    navigation.navigate('Chat');
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
          }}
        >

        <View className="mb-6">
          <InsightCard
            badge="SUA JORNADA DE ONTEM"
            title={yesterdayInsight.title}
            description={yesterdayInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleContinueYesterday}
            locked={yesterdayInsight.locked}
            remaining={yesterdayInsight.remaining}
            onMicClick={() => navigateToChatVoice('yesterday_journey', yesterdayInsight)}
            micDisabled={yesterdayInsight.locked}
          />
        </View>

        <View className="mb-6">
          <InsightCard
            badge="INSPIRADO EM VOCÊ"
            title={generalInsight.title}
            description={generalInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleTalkAboutInsight}
            locked={generalInsight.locked}
            remaining={generalInsight.remaining}
            onMicClick={() => navigateToChatVoice('general_insight', generalInsight)}
            micDisabled={generalInsight.locked}
          />
        </View>

        <View className="mb-6">
          <InsightCard
            badge="SUA FREQUÊNCIA"
            title={frequencyInsight.title}
            description={frequencyInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleTalkAboutFrequency}
            locked={frequencyInsight.locked}
            remaining={frequencyInsight.remaining}
            onMicClick={() => navigateToChatVoice('frequency', frequencyInsight)}
            micDisabled={frequencyInsight.locked}
          />
        </View>

        <View className="mb-6">
          <InsightCard
            badge="CONSTRUA UM HÁBITO"
            title={habitInsight.title}
            description={habitInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleStartHabit}
            locked={habitInsight.locked}
            remaining={habitInsight.remaining}
            onMicClick={() => navigateToChatVoice('habit', habitInsight)}
            micDisabled={habitInsight.locked}
          />
        </View>
        </View>
      </ScrollView>
      </View>
    </ScreenLoadingGate>
  );
}
