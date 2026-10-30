import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { BudButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreeningCadence } from '@/hooks/useScreeningCadence';
import { supabase } from '@/integrations/supabase/client';
import { invalidateDeclaredUserContext } from '@/lib/invalidateDeclaredUserContext';
import {
  HEALTH_SURVEY_INSTRUMENT,
  HEALTH_SURVEY_QUESTION_COUNT,
  HEALTH_SURVEY_STEPS,
  UNKNOWN_ANSWER,
  VAS_DEFAULT,
  healthSurveyScore,
  isStepAnswered,
  persistableAnswers,
  visibleHealthSurveySteps,
} from '@/pages/institution/healthSurvey';
import {
  SurveyChoice,
  SurveyClockIcon,
  SurveyField,
  SurveyHeader,
  SurveyLockIcon,
  SurveyScale,
  SurveyVas,
} from '@/pages/institution/surveyChrome';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

type Phase = 'intro' | 'questions' | 'thanks';

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '');
}

function questionTop(type: 'choice' | 'number' | 'vas' | 'scale') {
  if (type === 'scale') return 108;
  if (type === 'number') return 78;
  if (type === 'vas') return 38;
  return 48;
}

export default function HealthSurveyScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const { snooze, refresh } = useScreeningCadence({ autoNavigate: false });
  const metaIcon = isDarkMode ? colors.text : colors.accent;
  const bottomPad = Math.max(insets.bottom, 16) + 16;
  const { g } = useGenderedCopy();

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    vas: String(VAS_DEFAULT),
  });
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => visibleHealthSurveySteps(answers), [answers]);
  const step = steps[Math.min(index, steps.length - 1)];
  const value = step ? answers[step.key] : undefined;
  const answered = step ? isStepAnswered(step, value) : false;
  const isLast = index >= steps.length - 1;
  const catalogIndex = step
    ? HEALTH_SURVEY_STEPS.findIndex((item) => item.key === step.key)
    : 0;
  const progress = Math.min(1, (catalogIndex + 1) / HEALTH_SURVEY_QUESTION_COUNT);
  const nextDate = useMemo(
    () => format(addMonths(new Date(), 3), "d 'de' MMMM", { locale: ptBR }),
    [],
  );

  const close = useCallback(() => {
    snooze();
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Home');
  }, [navigation, snooze]);

  const persist = useCallback(
    async (nextAnswers: Record<string, string>) => {
      if (!user?.id) return;
      setSaving(true);
      const stored = persistableAnswers(nextAnswers);
      await supabase.from('clinical_screenings' as never).insert({
        user_id: user.id,
        instrument: HEALTH_SURVEY_INSTRUMENT,
        responses: stored,
        score_internal: healthSurveyScore(stored),
      } as never);
      invalidateDeclaredUserContext(user.id);
      setSaving(false);
      setPhase('thanks');
      void refresh();
    },
    [refresh, user?.id],
  );

  const goNext = useCallback(() => {
    if (!answered || saving || !step) return;
    if (isLast) {
      void persist(answers);
      return;
    }
    setIndex((current) => current + 1);
  }, [answered, answers, isLast, persist, saving, step]);

  const choose = useCallback(
    (next: string) => {
      if (!step || saving) return;
      const nextAnswers = { ...answers, [step.key]: next };
      setAnswers(nextAnswers);
      const nextSteps = visibleHealthSurveySteps(nextAnswers);
      const currentPos = nextSteps.findIndex((item) => item.key === step.key);
      if (currentPos >= nextSteps.length - 1) {
        void persist(nextAnswers);
        return;
      }
      setIndex(currentPos + 1);
    },
    [answers, persist, saving, step],
  );

  const goBack = useCallback(() => {
    if (index <= 0) {
      setPhase('intro');
      return;
    }
    setIndex((current) => current - 1);
  }, [index]);

  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SurveyHeader title="Pesquisa de saúde" onClose={close} titleAlign="left" />
        <View style={{ flex: 1, paddingHorizontal: 30 }}>
          <Image
            source={assets.healthClipboard}
            style={{ width: 140, height: 200, marginTop: 36, alignSelf: 'center' }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.4,
              color: colors.text,
              marginTop: 30,
            }}
          >
            Um retrato da sua{' '}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>saúde</Text>
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              marginTop: 16,
            }}
          >
            No primeiro acesso e depois a cada 3 meses, o Bud faz algumas perguntas sobre saúde,
            rotina e trabalho. Assim dá para ver o que está mudando com o tempo.
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 22,
            }}
          >
            <SurveyClockIcon color={metaIcon} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, color: colors.text }}>
              Uns 4 minutos · 22 perguntas
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 12,
            }}
          >
            <SurveyLockIcon color={metaIcon} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, color: colors.text }}>
              Suas respostas são confidenciais.
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: bottomPad }}>
          <BudButton label="Começar" onPress={() => setPhase('questions')} />
        </View>
      </View>
    );
  }

  if (phase === 'thanks') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 136 }}>
          <Image
            source={assets.healthSprout}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.4,
              color: colors.text,
              textAlign: 'center',
              marginTop: 40,
              paddingHorizontal: 30,
            }}
          >
            Obrigado por fazer a{'\n'}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>diferença</Text>
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              textAlign: 'center',
              marginTop: 30,
              width: 360,
              maxWidth: '100%',
            }}
          >
            Suas respostas ajudam o Bud a cuidar melhor de você. A próxima pesquisa chega em 3 meses,
            no dia {nextDate}.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: bottomPad }}>
          <BudButton
            label="Concluir"
            onPress={() => {
              snooze();
              navigation.navigate('Home');
            }}
          />
        </View>
      </View>
    );
  }

  if (!step) return null;

  const needsContinue = step.input.type !== 'choice';
  const numberValue = step.input.type === 'number' && value !== UNKNOWN_ANSWER ? (value ?? '') : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SurveyHeader title="Pesquisa de saúde" onBack={goBack} progress={progress} />

      {step.input.type === 'vas' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 28, paddingTop: questionTop('vas') }}>
            {step.kicker ? (
              <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
                {g(step.kicker)}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 32,
                letterSpacing: -0.4,
                color: colors.text,
                marginTop: step.input.type === 'scale' ? 0 : 14,
              }}
            >
              {g(step.title)}
            </Text>
          </View>
          <View style={{ flex: 1, marginTop: 40 }}>
            <SurveyVas
              value={Number(value ?? VAS_DEFAULT)}
              minLabel={step.input.minLabel}
              maxLabel={step.input.maxLabel}
              onChange={(next) => setAnswers((current) => ({ ...current, [step.key]: String(next) }))}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: questionTop(step.input.type),
            paddingBottom: needsContinue ? 24 : bottomPad,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 28 }}>
            {step.kicker ? (
              <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
                {g(step.kicker)}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 32,
                letterSpacing: -0.4,
                color: colors.text,
                marginTop: step.input.type === 'scale' ? 0 : 14,
              }}
            >
              {g(step.title)}
            </Text>
          </View>

          {step.input.type === 'number' ? (
            <View style={{ marginTop: 28, paddingHorizontal: 28 }}>
              <SurveyField
                value={numberValue}
                placeholder={step.input.placeholder}
                onChangeText={(next) =>
                  setAnswers((current) => ({ ...current, [step.key]: digitsOnly(next) }))
                }
              />
            </View>
          ) : null}

          {step.input.type === 'scale' ? (
            <View style={{ marginTop: 62, paddingHorizontal: 24 }}>
              <SurveyScale
                value={value === undefined ? undefined : Number(value)}
                min={step.input.min}
                max={step.input.max}
                minLabel={step.input.minLabel}
                maxLabel={step.input.maxLabel}
                onChange={(next) => setAnswers((current) => ({ ...current, [step.key]: String(next) }))}
              />
            </View>
          ) : null}

          {step.input.type === 'choice' ? <View style={{ flex: 1 }} /> : null}

          {step.input.type === 'choice' ? (
            <View style={{ gap: 8, paddingHorizontal: 24 }}>
              {step.input.options.map((option) => (
                <SurveyChoice
                  key={option}
                  label={option}
                  selected={value === option}
                  onPress={() => choose(option)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      {needsContinue ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: bottomPad, gap: 14 }}>
          {step.input.type === 'number' && step.input.allowUnknown ? (
            <BudButton
              label="Não sei"
              variant="outline"
              onPress={() =>
                setAnswers((current) => ({ ...current, [step.key]: UNKNOWN_ANSWER }))
              }
            />
          ) : null}
          <BudButton
            label="Continuar"
            disabled={!answered}
            loading={saving}
            onPress={goNext}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
