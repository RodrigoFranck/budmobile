import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckInFlowHeader } from '@/components/checkin/CheckInFlowHeader';
import { CheckInSliderInput } from '@/components/checkin/CheckInSliderInput';
import { CheckInTextInput } from '@/components/checkin/CheckInTextInput';
import { useCheckInFlowStyles } from '@/components/checkin/checkInFlow.styles';
import type { PsychologicalAssessmentStepConfig } from '@/features/psychologicalAssessment/psychologicalAssessment.types';
import {
  PSYCHOLOGICAL_ASSESSMENT_TOTAL_QUESTIONS,
  psychologicalAssessmentSteps,
} from '@/features/psychologicalAssessment/psychologicalAssessmentSteps';
import { usePsychologicalAssessment } from '@/hooks/usePsychologicalAssessment';
import { useActivitiesTheme } from '@/lib/activitiesTheme';
import type { PsychologicalAssessmentStackParamList } from '@/types/psychologicalAssessmentNavigation';

type Nav = NativeStackNavigationProp<
  PsychologicalAssessmentStackParamList,
  'PsychologicalAssessmentFlow'
>;

function isStepAnswered(step: PsychologicalAssessmentStepConfig, value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export default function PsychologicalAssessmentFlowScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { submitAssessment } = usePsychologicalAssessment();
  const theme = useActivitiesTheme();
  const styles = useCheckInFlowStyles();

  const steps = useMemo(() => psychologicalAssessmentSteps, []);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const step = steps[currentStep];
  const value = responses[step.key];
  const progress = ((currentStep + 1) / PSYCHOLOGICAL_ASSESSMENT_TOTAL_QUESTIONS) * 100;
  const answered = isStepAnswered(step, value);
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (step.inputType !== 'slider') return;
    setResponses((prev) => {
      if (prev[step.key] !== undefined) return prev;
      const mid = Math.round(((step.min ?? 0) + (step.max ?? 10)) / 2);
      return { ...prev, [step.key]: mid };
    });
  }, [step.key, step.inputType, step.min, step.max]);

  const setValue = useCallback((key: string, next: unknown) => {
    setResponses((prev) => ({ ...prev, [key]: next }));
  }, []);

  const handleSliderChange = useCallback(
    (next: number) => {
      setResponses((prev) => ({ ...prev, [step.key]: next }));
    },
    [step.key],
  );

  const handleClose = useCallback(() => {
    Alert.alert('Sair da avaliação?', 'Suas respostas desta sessão serão perdidas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => navigation.getParent()?.goBack(),
      },
    ]);
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      handleClose();
      return;
    }
    setCurrentStep((s) => s - 1);
  }, [currentStep, handleClose]);

  const finishFlow = useCallback(async () => {
    setSubmitting(true);
    try {
      const saved = await submitAssessment(responses);
      if (!saved) {
        Alert.alert('Erro', 'Não foi possível salvar a avaliação. Tente novamente.');
        return;
      }

      Alert.alert(
        'Avaliação concluída',
        'Suas respostas foram salvas. O Bud vai usar isso para personalizar nossas conversas.',
        [
          {
            text: 'OK',
            onPress: () => navigation.getParent()?.goBack(),
          },
        ],
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível concluir a avaliação.');
    } finally {
      setSubmitting(false);
    }
  }, [navigation, responses, submitAssessment]);

  const handleNext = useCallback(() => {
    if (!answered || submitting) return;
    if (isLastStep) {
      finishFlow();
      return;
    }
    setCurrentStep((s) => s + 1);
  }, [answered, finishFlow, isLastStep, submitting]);

  const renderInput = () => {
    switch (step.inputType) {
      case 'slider':
        return (
          <CheckInSliderInput
            min={step.min ?? 0}
            max={step.max ?? 10}
            value={
              (value as number | undefined) ??
              Math.round(((step.min ?? 0) + (step.max ?? 10)) / 2)
            }
            minLabel={step.minLabel}
            maxLabel={step.maxLabel}
            onChange={handleSliderChange}
          />
        );
      case 'text':
        return (
          <CheckInTextInput
            value={(value as string | undefined) ?? ''}
            placeholder={step.textPlaceholder}
            onChange={(v) => setValue(step.key, v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <CheckInFlowHeader
          progress={progress}
          topInset={insets.top}
          onBack={handleBack}
          onClose={handleClose}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={step.inputType !== 'slider'}
        >
          <Text style={styles.category}>{step.category}</Text>
          <Text style={styles.question}>{step.question}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={styles.inputArea}>{renderInput()}</View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.primaryButton, (!answered || submitting) && styles.primaryButtonDisabled]}
            onPress={handleNext}
            disabled={!answered || submitting}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? 'Finalizar avaliação' : 'Próximo passo'}
          >
            {submitting ? (
              <ActivityIndicator color={theme.ctaText} />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {isLastStep ? 'Finalizar' : 'Próximo'}
              </Text>
            )}
          </Pressable>
          <Text style={styles.stepCounter}>
            {currentStep + 1} de {PSYCHOLOGICAL_ASSESSMENT_TOTAL_QUESTIONS}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
