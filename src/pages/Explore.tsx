import { useEffect, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Settings } from 'lucide-react-native';
import { useExploreInsights } from '@/hooks/useExploreInsights';
import type { Insight } from '@/hooks/useExploreInsights';
import { InsightCard } from '@/components/explore/InsightCard';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';
import { LayoutSpacing, ExploreGradientColors } from '@/constants/layout';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function ExploreScreen() {
  const navigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
  } = useExploreInsights();

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
          paddingTop: insets.top + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
        style={{ flex: 1, zIndex: 1 }}
      >
        <WeekCalendarHeader
          leftIcon={Book}
          onPressLeft={() => navigation.navigate('Explore')}
          showLeftIndicatorDot
          rightIcon={Settings}
          onPressRight={() => rootNavigation.navigate('Settings')}
        />

        <View className="mb-6">
          <InsightCard
            badge="SUA JORNADA DE ONTEM"
            title={yesterdayInsight.title}
            description={yesterdayInsight.description}
            buttonText="Envie uma mensagem"
            onButtonClick={handleContinueYesterday}
            loading={yesterdayInsight.loading}
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
            loading={generalInsight.loading}
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
            loading={frequencyInsight.loading}
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
            loading={habitInsight.loading}
            locked={habitInsight.locked}
            remaining={habitInsight.remaining}
            onMicClick={() => navigateToChatVoice('habit', habitInsight)}
            micDisabled={habitInsight.locked}
          />
        </View>
      </ScrollView>
    </View>
  );
}
