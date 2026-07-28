import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckInChipList } from '@/components/checkin/CheckInChipList';
import { CheckInFlowHeader } from '@/components/checkin/CheckInFlowHeader';
import { CheckInSliderInput } from '@/components/checkin/CheckInSliderInput';
import { CheckInTextInput } from '@/components/checkin/CheckInTextInput';
import { useCheckInFlowStyles } from '@/components/checkin/checkInFlow.styles';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { getCheckInSteps } from '@/features/checkin/checkInSteps';
import type { CheckInStepConfig } from '@/features/checkin/checkInFlow.types';
import { useCheckIns, type CheckinType } from '@/hooks/useCheckIns';
import { resolveCheckInGradient, useActivitiesTheme } from '@/lib/activitiesTheme';
import type { ActivitiesStackParamList } from '@/types/activitiesNavigation.types';
import { isPostGameCheckInAvailable } from '@/utils/dateUtils';

type Route = RouteProp<ActivitiesStackParamList, 'CheckInFlow'>;
type Nav = NativeStackNavigationProp<ActivitiesStackParamList, 'CheckInFlow'>;

function isStepAnswered(step: CheckInStepConfig, value: unknown): boolean {
  if (step.optional) return true;
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

export default function CheckInFlowScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { submitCheckin } = useCheckIns();
  const { showAlert } = useAppAlert();
  const theme = useActivitiesTheme();
  const styles = useCheckInFlowStyles();

  const checkinType: CheckinType = route.params.type;
  const steps = useMemo(() => getCheckInSteps(checkinType), [checkinType]);

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const step = steps[currentStep];
  const value = responses[step.key];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const answered = isStepAnswered(step, value);
  const isLastStep = currentStep === steps.length - 1;

  const stepGradient = useMemo(
    () => resolveCheckInGradient(step.gradientColors, theme.surface),
    [step.gradientColors, theme.surface],
  );

  useEffect(() => {
    if (step.inputType !== 'slider') return;
    setResponses((prev) => {
      if (prev[step.key] !== undefined) return prev;
      const mid = Math.round(((step.min ?? 1) + (step.max ?? 10)) / 2);
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
    showAlert({
      title: 'Sair do check-in?',
      message: 'Suas respostas desta sessão serão perdidas.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    });
  }, [navigation, showAlert]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      handleClose();
      return;
    }
    setCurrentStep((s) => s - 1);
  }, [currentStep, handleClose]);

  const finishFlow = useCallback(async () => {
    if (checkinType === 'post_game' && !isPostGameCheckInAvailable()) {
      showAlert({
        title: 'Ainda não disponível',
        message: 'O check-in pós-jogo libera todo domingo a partir das 8h.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const saved = await submitCheckin(checkinType, responses);
      if (!saved) {
        showAlert({ title: 'Erro', message: 'Não foi possível salvar o check-in.' });
        return;
      }

      navigation.replace('CheckInResult', {
        type: checkinType,
        checkinId: saved.id,
        report: null,
        pendingReport: true,
        responses,
        checkinResponses: responses,
      });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erro', message: 'Não foi possível concluir o check-in.' });
    } finally {
      setSubmitting(false);
    }
  }, [checkinType, navigation, responses, showAlert, submitCheckin]);

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
            min={step.min ?? 1}
            max={step.max ?? 10}
            value={(value as number | undefined) ?? Math.round(((step.min ?? 1) + (step.max ?? 10)) / 2)}
            minLabel={step.minLabel}
            maxLabel={step.maxLabel}
            onChange={handleSliderChange}
          />
        );
      case 'chips':
        return (
          <CheckInChipList
            options={step.options ?? []}
            value={value as string | undefined}
            onChange={(v) => setValue(step.key, v)}
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
      <LinearGradient
        colors={[...stepGradient]}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

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
            accessibilityLabel={isLastStep ? 'Finalizar check-in' : 'Próximo passo'}
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
            {currentStep + 1} de {steps.length}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
