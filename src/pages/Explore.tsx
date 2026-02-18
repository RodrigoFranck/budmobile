import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useExploreInsights } from '@/hooks/useExploreInsights';
import { useUserPlan } from '@/hooks/useUserPlan';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { InsightCard } from '@/components/explore/InsightCard';
import type { NavigationProp } from '@/types/navigation';
import { LayoutSpacing, ExploreGradientColors } from '@/constants/layout';

const yesterdayBg = require('@/assets/yesterday-journey-bg.png');
const inspiredBg = require('@/assets/inspired-bg.png');
const frequencyBg = require('@/assets/frequency-bg.png');
const habitBg = require('@/assets/habit-bg.png');

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const { canAccess } = useUserPlan();
  const {
    yesterdayInsight,
    generalInsight,
    frequencyInsight,
    habitInsight,
    isLoading,
  } = useExploreInsights();

  // Animação do gradiente usando múltiplos gradientes sobrepostos
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

  // Verificar acesso a features
  const hasInspiredAccess = canAccess('inspired_insight');
  const hasFrequencyAccess = canAccess('frequency_insight');
  const hasHabitAccess = canAccess('habit_insight');
  const hasDeepInsightAccess = canAccess('deep_insight');

  const handleContinueYesterday = () => {
    navigation.navigate('Chat', {
      // Passar contexto para o Chat se necessário
    } as any);
  };

  const handleTalkAboutInsight = () => {
    if (!hasInspiredAccess) {
      // TODO: Mostrar paywall
      return;
    }
    navigation.navigate('Chat', {
      // Passar contexto para o Chat se necessário
    } as any);
  };

  const handleStartHabit = () => {
    if (!hasHabitAccess) {
      // TODO: Mostrar paywall
      return;
    }
    navigation.navigate('Chat', {
      // Passar contexto para o Chat se necessário
    } as any);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Gradiente base */}
      <LinearGradient
        colors={ExploreGradientColors.base}
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
      {/* Gradiente animado sobreposto */}
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
          colors={ExploreGradientColors.animated}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Header />
      <Sidebar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom,
        }}
        style={{ flex: 1, zIndex: 1 }}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-foreground mb-2">
            Explorar
          </Text>
          <Text className="text-lg text-muted-foreground">
            Insights personalizados sobre sua jornada
          </Text>
        </View>

        {/* Card 1: Jornada de Ontem */}
        <View className="mb-6">
          <InsightCard
            badge="SUA JORNADA DE ONTEM"
            title={yesterdayInsight.title}
            description={yesterdayInsight.description}
            buttonText="Continuar falando disso"
            onButtonClick={handleContinueYesterday}
            loading={yesterdayInsight.loading}
            locked={yesterdayInsight.locked}
            remaining={yesterdayInsight.remaining}
            backgroundImage={yesterdayBg}
          />
        </View>

        {/* Card 2: Insight Geral */}
        <View className="mb-6">
          <InsightCard
            badge="INSPIRADO EM VOCÊ"
            title={generalInsight.title}
            description={generalInsight.description}
            buttonText="Conversar sobre isso"
            onButtonClick={handleTalkAboutInsight}
            loading={generalInsight.loading}
            locked={generalInsight.locked || !hasInspiredAccess}
            remaining={generalInsight.remaining}
            lockedMessage={!hasInspiredAccess ? 'Upgrade para desbloquear' : undefined}
            backgroundImage={inspiredBg}
          />
        </View>

        {/* Card 3: Frequência - SEM BOTÃO */}
        <View className="mb-6">
          <InsightCard
            badge="SUA FREQUÊNCIA"
            title={frequencyInsight.title}
            description={frequencyInsight.description}
            loading={frequencyInsight.loading}
            locked={frequencyInsight.locked || !hasFrequencyAccess}
            remaining={frequencyInsight.remaining}
            lockedMessage={!hasFrequencyAccess ? 'Upgrade para desbloquear' : undefined}
            backgroundImage={frequencyBg}
          />
        </View>

        {/* Card 4: Hábito Saudável */}
        <View className="mb-6">
          <InsightCard
            badge="CONSTRUA UM HÁBITO"
            title={habitInsight.title}
            description={habitInsight.description}
            buttonText="Começar agora"
            onButtonClick={handleStartHabit}
            loading={habitInsight.loading}
            locked={habitInsight.locked || !hasHabitAccess}
            remaining={habitInsight.remaining}
            lockedMessage={!hasHabitAccess ? 'Upgrade para desbloquear' : undefined}
            backgroundImage={habitBg}
          />
        </View>
      </ScrollView>
    </View>
  );
}
