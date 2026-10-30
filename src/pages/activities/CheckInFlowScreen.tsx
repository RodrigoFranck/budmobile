import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { ACTION_EVENTS, logActionEvent } from '@/analytics';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { getCheckInSteps, getOptionLabel, getOptionSubtitle } from '@/features/checkin/checkInSteps';
import type { CheckInStepConfig } from '@/features/checkin/checkInFlow.types';
import { useCheckIns, type CheckinType } from '@/hooks/useCheckIns';
import { SurveyChoice, SurveyHeader, SurveyScale } from '@/pages/institution/surveyChrome';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Colors } from '@/theme';
import type { CheckInStackParamList } from '@/types/checkInNavigation.types';

type Route = RouteProp<CheckInStackParamList, 'CheckInFlow'>;
type Nav = NativeStackNavigationProp<CheckInStackParamList, 'CheckInFlow'>;

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
  const colors = useV3Colors();
  const { submitCheckin } = useCheckIns();
  const { showAlert } = useAppAlert();
  const { g } = useGenderedCopy();

  const checkinType: CheckinType = route.params.type;
  const steps = useMemo(() => getCheckInSteps(checkinType), [checkinType]);

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  const step = steps[currentStep];
  const value = responses[step.key];
  const progress = (currentStep + 1) / steps.length;
  const answered = isStepAnswered(step, value);
  const isLastStep = currentStep === steps.length - 1;
  const needsContinue = step.inputType !== 'chips';

  useEffect(() => {
    void logActionEvent(ACTION_EVENTS.CHECKIN_STARTED, { checkin_type: checkinType });
  }, [checkinType]);

  const handleClose = useCallback(() => {
    showAlert({
      title: 'Sair do check-in?',
      message: 'Suas respostas desta sessão serão perdidas.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            void logActionEvent(ACTION_EVENTS.CHECKIN_ABANDONED, {
              checkin_type: checkinType,
              step_index: currentStep,
              progress_percent: Math.round(progress * 100),
            });
            navigation.goBack();
          },
        },
      ],
    });
  }, [checkinType, currentStep, navigation, progress, showAlert]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      handleClose();
      return;
    }
    setCurrentStep((s) => s - 1);
  }, [currentStep, handleClose]);

  const finishFlow = useCallback(
    async (nextResponses: Record<string, unknown>) => {
      setSubmitting(true);
      try {
        const saved = await submitCheckin(checkinType, nextResponses);
        if (!saved) {
          showAlert({ title: 'Erro', message: 'Não foi possível salvar o check-in.' });
          return;
        }

        navigation.replace('CheckInResult', {
          type: checkinType,
          checkinId: saved.id,
          report: null,
          pendingReport: true,
          responses: nextResponses,
          checkinResponses: nextResponses,
        });
        void logActionEvent(ACTION_EVENTS.CHECKIN_COMPLETED, {
          checkin_type: checkinType,
          step_count: steps.length,
        });
      } catch (err) {
        console.error(err);
        showAlert({ title: 'Erro', message: 'Não foi possível concluir o check-in.' });
      } finally {
        setSubmitting(false);
      }
    },
    [checkinType, navigation, showAlert, steps.length, submitCheckin],
  );

  const goNext = useCallback(
    (nextResponses = responses) => {
      if (submitting) return;
      if (isLastStep) {
        void finishFlow(nextResponses);
        return;
      }
      setCurrentStep((s) => s + 1);
    },
    [finishFlow, isLastStep, responses, submitting],
  );

  const choose = useCallback(
    (next: string) => {
      const nextResponses = { ...responses, [step.key]: next };
      setResponses(nextResponses);
      goNext(nextResponses);
    },
    [goNext, responses, step.key],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SurveyHeader
        title="Check-in"
        onBack={handleBack}
        onClose={handleClose}
        progress={progress}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: needsContinue ? 24 : Math.max(insets.bottom, 16) + 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step.subtitle ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
            {g(step.subtitle)}
          </Text>
        ) : (
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
            {step.category}
          </Text>
        )}
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.4,
            color: colors.text,
            marginTop: 14,
          }}
        >
          {g(step.question)}
        </Text>

        {step.inputType === 'slider' ? (
          <View style={{ marginTop: 48 }}>
            <SurveyScale
              value={(value as number | undefined) ?? undefined}
              min={step.min ?? 1}
              max={step.max ?? 10}
              minLabel={step.minLabel ?? ''}
              maxLabel={step.maxLabel ?? ''}
              onChange={(next) => setResponses((prev) => ({ ...prev, [step.key]: next }))}
            />
          </View>
        ) : null}

        {step.inputType === 'text' ? (
          <View
            style={{
              marginTop: 28,
              minHeight: 120,
              borderRadius: 20,
              backgroundColor: colors.surface2,
              paddingHorizontal: 22,
              paddingVertical: 16,
            }}
          >
            <TextInput
              value={(value as string | undefined) ?? ''}
              onChangeText={(next) => setResponses((prev) => ({ ...prev, [step.key]: next }))}
              placeholder={step.textPlaceholder}
              placeholderTextColor={colors.text3}
              multiline
              textAlignVertical="top"
              style={{
                fontFamily: fonts.sans,
                fontSize: 16,
                lineHeight: 22,
                color: colors.text,
                minHeight: 88,
                padding: 0,
              }}
            />
          </View>
        ) : null}

        {step.inputType === 'chips' ? <View style={{ flex: 1 }} /> : null}

        {step.inputType === 'chips' ? (
          <View style={{ gap: 8 }}>
            {(step.options ?? []).map((option) => {
              const label = getOptionLabel(option);
              return (
                <SurveyChoice
                  key={label}
                  label={label}
                  subtitle={getOptionSubtitle(option)}
                  selected={value === label}
                  onPress={() => choose(label)}
                />
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {needsContinue ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <BudButton
            label={isLastStep ? 'Finalizar' : 'Continuar'}
            disabled={!answered}
            loading={submitting}
            onPress={() => goNext()}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
