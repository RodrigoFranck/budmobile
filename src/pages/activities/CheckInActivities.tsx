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

import morningCardBg from '@/assets/yesterday-journey-bg.png';
import postTrainingCardBg from '@/assets/frequency-bg.png';
import { useCheckIns, type CheckinType } from '@/hooks/useCheckIns';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import { createCheckInActivitiesStyles } from './CheckInActivities.styles';

type Nav = NativeStackNavigationProp<ActivitiesStackParamList, 'CheckInActivities'>;

function getCtaLabel(done: boolean, hasReport: boolean): string {
  if (!done) return 'Começar →';
  if (hasReport) return 'Ver relatório →';
  return 'Concluído';
}

export default function CheckInActivities() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { todayMorning, todayPostTraining, loading } = useCheckIns();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createCheckInActivitiesStyles(theme), [theme]);

  const handlePress = useCallback(
    (type: CheckinType) => {
      const existing = type === 'morning' ? todayMorning : todayPostTraining;
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
        navigation.navigate('CheckInFlow', { type });
        return;
      }
      navigation.navigate('CheckInFlow', { type });
    },
    [navigation, todayMorning, todayPostTraining],
  );

  const renderCard = (
    type: CheckinType,
    title: string,
    prompt: string,
    image: number,
    done: boolean,
    hasReport: boolean,
  ) => (
    <Pressable
      style={styles.card}
      onPress={() => handlePress(type)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${prompt}. ${getCtaLabel(done, hasReport)}`}
    >
      <ImageBackground source={image} style={styles.cardImage} resizeMode="cover">
        <View style={styles.cardOverlay} />
        <View style={styles.cardBody}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardPrompt}>{prompt}</Text>
          </View>
          <View style={styles.cardFooter}>
            {loading ? (
              <ActivityIndicator color={theme.questionOnCard} size="small" />
            ) : (
              <Text style={styles.cardCta}>{getCtaLabel(done, hasReport)}</Text>
            )}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );

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
        <Text style={styles.subtitle}>Dois check-ins por dia.</Text>

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
      </ScrollView>
    </View>
  );
}
