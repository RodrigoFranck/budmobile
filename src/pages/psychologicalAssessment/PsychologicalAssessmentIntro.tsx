import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PSYCHOLOGICAL_ASSESSMENT_TOTAL_QUESTIONS } from '@/features/psychologicalAssessment/psychologicalAssessmentSteps';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { PsychologicalAssessmentStackParamList } from '@/types/psychologicalAssessmentNavigation';
import { createPsychologicalAssessmentIntroStyles } from './PsychologicalAssessmentIntro.styles';

type Nav = NativeStackNavigationProp<
  PsychologicalAssessmentStackParamList,
  'PsychologicalAssessmentIntro'
>;

export default function PsychologicalAssessmentIntro() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const theme = useActivitiesTheme();
  const styles = useMemo(() => createPsychologicalAssessmentIntroStyles(theme), [theme]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Questionário Psicológico
        </Text>
        <Text style={styles.description}>
          {PSYCHOLOGICAL_ASSESSMENT_TOTAL_QUESTIONS} perguntas rápidas pra eu te conhecer melhor
          como atleta. Suas respostas vão me ajudar a entender seus padrões emocionais e
          personalizar nossas conversas.
        </Text>
        <View style={styles.durationRow}>
          <Clock color={theme.muted} size={16} />
          <Text style={styles.durationText}>3-5 minutos</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('PsychologicalAssessmentFlow')}
          accessibilityRole="button"
          accessibilityLabel="Começar questionário psicológico"
        >
          <Text style={styles.primaryButtonLabel}>Começar</Text>
        </Pressable>
      </View>
    </View>
  );
}
