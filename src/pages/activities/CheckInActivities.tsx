import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import habitCardBg from '@/assets/habit-bg.png';
import morningCardBg from '@/assets/yesterday-journey-bg.png';
import postTrainingCardBg from '@/assets/frequency-bg.png';
import { useCheckIns, type CheckinType, type DailyCheckin } from '@/hooks/useCheckIns';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import { isPostGameCheckInAvailable } from '@/utils/dateUtils';
import { createCheckInActivitiesStyles } from './CheckInActivities.styles';

type Nav = NativeStackNavigationProp<ActivitiesStackParamList, 'CheckInActivities'>;

function getCtaLabel(done: boolean, hasReport: boolean, locked: boolean): string {
  if (locked && !done) return 'Domingo às 8h';
  if (!done) return 'Começar →';
  if (hasReport) return 'Ver relatório →';
  return 'Gerar relatório →';
}

function getExistingCheckin(
  type: CheckinType,
  todayMorning: DailyCheckin | null,
  todayPostTraining: DailyCheckin | null,
  todayPostGame: DailyCheckin | null,
): DailyCheckin | null {
  if (type === 'morning') return todayMorning;
  if (type === 'post_game') return todayPostGame;
  return todayPostTraining;
}

export default function CheckInActivities() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { todayMorning, todayPostTraining, todayPostGame, loading } = useCheckIns();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createCheckInActivitiesStyles(theme), [theme]);
  const postGameAvailable = isPostGameCheckInAvailable();

  const handlePress = useCallback(
    (type: CheckinType) => {
      if (type === 'post_game' && !postGameAvailable) {
        const existing = todayPostGame;
        if (!existing) return;
      }

      const existing = getExistingCheckin(
        type,
        todayMorning,
        todayPostTraining,
        todayPostGame,
      );

      if (existing?.ai_report) {
        navigation.navigate('CheckInResult', {
          type,
          checkinId: existing.id,
          report: existing.ai_report,
          checkinResponses: existing.responses as Record<string, unknown>,
        });
        return;
      }
      if (existing) {
        navigation.navigate('CheckInResult', {
          type,
          checkinId: existing.id,
          report: null,
          pendingReport: true,
          responses: existing.responses as Record<string, unknown>,
          checkinResponses: existing.responses as Record<string, unknown>,
        });
        return;
      }
      navigation.navigate('CheckInFlow', { type });
    },
    [navigation, postGameAvailable, todayMorning, todayPostGame, todayPostTraining],
  );

  const renderCard = (
    type: CheckinType,
    title: string,
    prompt: string,
    image: number,
    done: boolean,
    hasReport: boolean,
    locked = false,
  ) => {
    const disabled = locked && !done;

    return (
      <Pressable
        style={[styles.card, disabled && styles.cardLocked]}
        onPress={() => handlePress(type)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={`${title}. ${prompt}. ${getCtaLabel(done, hasReport, locked)}`}
      >
        <ImageBackground source={image} style={styles.cardImage} resizeMode="cover">
          <View style={[styles.cardOverlay, disabled && styles.cardOverlayLocked]} />
          <View style={styles.cardBody}>
            <View>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardPrompt}>{prompt}</Text>
            </View>
            <View style={styles.cardFooter}>
              {loading ? (
                <ActivityIndicator color={theme.questionOnCard} size="small" />
              ) : (
                <Text style={styles.cardCta}>{getCtaLabel(done, hasReport, locked)}</Text>
              )}
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ChevronLeft color={theme.icon} size={22} />
          </Pressable>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Atividades
        </Text>
        <Text style={styles.subtitle}>Check-ins diários e pós-jogo no domingo.</Text>

        {renderCard(
          'morning',
          'Manhã',
          'Como você acordou hoje?',
          morningCardBg,
          !!todayMorning,
          !!todayMorning?.ai_report,
        )}
        {renderCard(
          'post_training',
          'Pós-Treino',
          'Como o treino te deixou?',
          postTrainingCardBg,
          !!todayPostTraining,
          !!todayPostTraining?.ai_report,
        )}
        {renderCard(
          'post_game',
          'Pós-Jogo',
          'O que ficou desse jogo pra você?',
          habitCardBg,
          !!todayPostGame,
          !!todayPostGame?.ai_report,
          !postGameAvailable,
        )}
      </ScrollView>
    </View>
  );
}
