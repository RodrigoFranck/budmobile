import { useMemo } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brain, ChevronLeft, Clock } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import checkInIntroHero from '@/assets/yesterday-journey-bg.png';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getNowInBrasilia } from '@/utils/dateUtils';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';
import {
  createCheckInIntroStyles,
  HERO_HEIGHT,
} from './CheckInIntro.styles';

type Nav = NativeStackNavigationProp<CheckInStackParamList, 'CheckInIntro'>;

const WARM_OVERLAY_COLORS = [
  'rgba(245,158,11,0.2)',
  'rgba(245,158,11,0)',
  'rgba(244,63,94,0.2)',
] as const;

function getFirstName(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

function getGreeting(firstName: string | null): string {
  const hour = getNowInBrasilia().getHours();
  let timeGreeting: string;
  if (hour >= 5 && hour < 12) timeGreeting = 'Bom dia';
  else if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
  else timeGreeting = 'Boa noite';
  return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
}

function getLeadCopy(): string {
  const hour = getNowInBrasilia().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Um momento pra começar o dia se ouvindo. Antes do treino, antes da correria.';
  }
  if (hour >= 12 && hour < 18) {
    return 'Pausa no meio do dia. Como você tá agora — de verdade?';
  }
  if (hour >= 18 && hour < 22) {
    return 'Fim de tarde, hora de olhar pra trás. Como o dia te deixou?';
  }
  return 'Antes de descansar, um minuto pra fechar o dia com você.';
}

function surfaceAlpha(surface: string, alpha: number): string {
  if (surface === '#1D1916') return `rgba(29,25,22,${alpha})`;
  if (surface === '#F7F1ED') return `rgba(247,241,237,${alpha})`;
  return surface;
}

function getHeroFadeColors(surface: string, isDark: boolean): readonly [string, string, string] {
  const mid = isDark ? 'rgba(29,25,22,0.4)' : 'rgba(247,241,237,0.4)';
  return [surfaceAlpha(surface, 0), mid, surface];
}

function getCtaFadeColors(surface: string): readonly [string, string, string] {
  return [surfaceAlpha(surface, 0), surfaceAlpha(surface, 0.95), surface];
}

export default function CheckInIntro() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createCheckInIntroStyles(theme), [theme]);

  const heroTotalHeight = HERO_HEIGHT + insets.top;
  const backTop = insets.top + 12;

  const heroFadeColors = useMemo(
    () => getHeroFadeColors(theme.surface, theme.isDark),
    [theme.isDark, theme.surface],
  );
  const ctaFadeColors = useMemo(
    () => getCtaFadeColors(theme.surface),
    [theme.surface],
  );

  const greeting = useMemo(
    () => getGreeting(getFirstName(profile?.name)),
    [profile?.name],
  );
  const lead = useMemo(() => getLeadCopy(), []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ height: heroTotalHeight }}>
          <ImageBackground
            source={checkInIntroHero}
            style={[styles.heroImage, { height: heroTotalHeight }]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          >
            <LinearGradient
              colors={[...WARM_OVERLAY_COLORS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroOverlay}
            />
            <LinearGradient
              colors={[...heroFadeColors]}
              locations={[0, 0.45, 1]}
              style={styles.heroOverlay}
            />
          </ImageBackground>

          <Pressable
            style={[styles.backButton, { top: backTop }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ChevronLeft color={theme.foreground} size={22} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.greeting} accessibilityRole="header">
            {greeting}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock color={theme.muted} size={14} />
              <Text style={styles.metaText}>1 min</Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <View style={styles.metaItem}>
              <Brain color={theme.muted} size={14} />
              <Text style={styles.metaText}>Check-in Diário</Text>
            </View>
          </View>

          <Text style={styles.lead}>{lead}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Como funciona</Text>
            <Text style={styles.sectionBody}>
              Perguntas simples sobre como você tá — humor, sono, energia, foco, time. No final, o Bud te devolve uma reflexão sobre o que ele percebeu nas suas respostas.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Por que funciona</Text>
            <Text style={styles.sectionBody}>
              Quando você para um minuto pra se ouvir, coisas que passam despercebidas viram visíveis. O check-in não é uma tarefa — é um espelho. Quanto mais você usa, mais você se conhece.
            </Text>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={[...ctaFadeColors]}
        locations={[0, 0.35, 1]}
        style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <Pressable
          style={styles.ctaButton}
          onPress={() => navigation.replace('CheckInActivities')}
          accessibilityRole="button"
          accessibilityLabel="Começar check-in"
        >
          <Text style={styles.ctaLabel}>Começar</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
