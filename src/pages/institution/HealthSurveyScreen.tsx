import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, format } from 'date-fns';
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
  clearHealthSurveyDraft,
  readHealthSurveyDraft,
  writeHealthSurveyDraft,
} from '@/pages/institution/healthSurveyDraft';
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
type NavDirection = 'forward' | 'back';

const SLIDE_EASE = Easing.out(Easing.cubic);
const FORWARD_MS = 350;
const BACK_MS = 300;
const DISSOLVE_MS = 300;
const KEYBOARD_FOOTER_GAP = 16;

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
  const { snooze, refresh, markComplete } = useScreeningCadence({ autoNavigate: false });
  const metaIcon = isDarkMode ? colors.text : colors.accent;
  const bottomPad = Math.max(insets.bottom, 16) + 16;
  const { g } = useGenderedCopy();
  const scrollRef = useRef<ScrollView>(null);
  const fieldYRef = useRef(0);
  const animatingRef = useRef(false);
  const screenWidth = Dimensions.get('window').width;

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    vas: String(VAS_DEFAULT),
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [navDirection, setNavDirection] = useState<NavDirection>('forward');

  const slideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const steps = useMemo(() => visibleHealthSurveySteps(answers), [answers]);
  const step = steps[Math.min(index, steps.length - 1)];
  const value = step ? answers[step.key] : undefined;
  const answered = step ? isStepAnswered(step, value) : false;
  const isLast = index >= steps.length - 1;
  const catalogIndex = step
    ? HEALTH_SURVEY_STEPS.findIndex((item) => item.key === step.key)
    : 0;
  const progress = Math.min(1, (catalogIndex + 1) / HEALTH_SURVEY_QUESTION_COUNT);
  const progressDurationMs = navDirection === 'forward' ? FORWARD_MS : BACK_MS;
  const nextDate = useMemo(
    () => format(addDays(new Date(), 30), "d 'de' MMMM", { locale: ptBR }),
    [],
  );

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDraftReady(true);
      return;
    }
    let cancelled = false;
    void readHealthSurveyDraft(user.id).then((draft) => {
      if (cancelled || !draft || draft.phase === 'thanks') {
        setDraftReady(true);
        return;
      }
      setAnswers(draft.answers);
      setIndex(draft.index);
      setPhase(draft.phase);
      setDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !draftReady || phase === 'thanks') return;
    void writeHealthSurveyDraft(user.id, { answers, index, phase });
  }, [answers, draftReady, index, phase, user?.id]);

  const playTransition = useCallback(
    (direction: NavDirection, apply: () => void) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      setNavDirection(direction);
      const finish = () => {
        animatingRef.current = false;
      };

      if (reduceMotion) {
        contentOpacity.value = withTiming(0, { duration: DISSOLVE_MS / 2, easing: SLIDE_EASE }, (finished) => {
          if (!finished) return;
          runOnJS(apply)();
          contentOpacity.value = withTiming(1, { duration: DISSOLVE_MS / 2, easing: SLIDE_EASE }, (done) => {
            if (done) runOnJS(finish)();
          });
        });
        return;
      }

      apply();
      // M11: entra pela direita. M12: volta deslizando para a direita (entra pela esquerda).
      slideX.value = direction === 'forward' ? screenWidth : -screenWidth;
      contentOpacity.value = 1;
      slideX.value = withTiming(
        0,
        {
          duration: direction === 'forward' ? FORWARD_MS : BACK_MS,
          easing: SLIDE_EASE,
        },
        (done) => {
          if (done) runOnJS(finish)();
        },
      );
    },
    [contentOpacity, reduceMotion, screenWidth, slideX],
  );

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: slideX.value }],
  }));

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
      if (!user?.id) {
        setSaveError('Não foi possível enviar. Entre de novo e tente outra vez.');
        return;
      }
      if (saving) return;

      setSaving(true);
      setSaveError(null);
      const stored = persistableAnswers(nextAnswers);
      const payload = {
        user_id: user.id,
        instrument: HEALTH_SURVEY_INSTRUMENT,
        responses: stored,
        score_internal: healthSurveyScore(stored),
        completed_at: new Date().toISOString(),
      };
      const startedAt = Date.now();
      console.info('[health_survey] persist start', {
        keys: Object.keys(stored),
        score_internal: payload.score_internal,
        at: payload.completed_at,
      });

      try {
        await writeHealthSurveyDraft(user.id, {
          answers: nextAnswers,
          index,
          phase: 'questions',
        });

        const { error } = await supabase.from('clinical_screenings' as never).insert(payload as never);
        const elapsedMs = Date.now() - startedAt;
        console.info('[health_survey] persist result', {
          ok: !error,
          elapsedMs,
          message: error?.message ?? null,
          code: error?.code ?? null,
        });

        if (error) {
          setSaveError('Não deu para enviar agora. Suas respostas estão salvas neste aparelho.');
          return;
        }

        invalidateDeclaredUserContext(user.id);
        await clearHealthSurveyDraft(user.id);
        markComplete();
        setPhase('thanks');
        void refresh();
      } catch (err) {
        const elapsedMs = Date.now() - startedAt;
        console.info('[health_survey] persist threw', {
          elapsedMs,
          error: err instanceof Error ? err.message : String(err),
        });
        setSaveError('Não deu para enviar agora. Suas respostas estão salvas neste aparelho.');
      } finally {
        setSaving(false);
      }
    },
    [index, markComplete, refresh, saving, user?.id],
  );

  const goNext = useCallback(() => {
    if (!answered || saving || !step || animatingRef.current) return;
    let nextAnswers = answers;
    if (step.key === 'trabalho_hours' && Number(answers.trabalho_hours) === 0) {
      const { trabalho_productivity: _skipped, ...rest } = answers;
      nextAnswers = rest;
      setAnswers(rest);
    }
    if (isLast) {
      void persist(nextAnswers);
      return;
    }
    const nextSteps = visibleHealthSurveySteps(nextAnswers);
    const currentPos = nextSteps.findIndex((item) => item.key === step.key);
    const nextIndex = currentPos >= 0 ? currentPos + 1 : index + 1;
    playTransition('forward', () => setIndex(nextIndex));
  }, [answered, answers, index, isLast, persist, playTransition, saving, step]);

  const choose = useCallback(
    (next: string) => {
      if (!step || saving || animatingRef.current) return;
      const nextAnswers = { ...answers, [step.key]: next };
      setAnswers(nextAnswers);
      const nextSteps = visibleHealthSurveySteps(nextAnswers);
      const currentPos = nextSteps.findIndex((item) => item.key === step.key);
      if (currentPos >= nextSteps.length - 1) {
        void persist(nextAnswers);
        return;
      }
      playTransition('forward', () => setIndex(currentPos + 1));
    },
    [answers, persist, playTransition, saving, step],
  );

  const goBack = useCallback(() => {
    if (animatingRef.current || saving) return;
    if (index <= 0) {
      playTransition('back', () => setPhase('intro'));
      return;
    }
    playTransition('back', () => setIndex((current) => current - 1));
  }, [index, playTransition, saving]);

  const scrollFieldIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, fieldYRef.current - 24),
        animated: true,
      });
    });
  }, []);

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
            No primeiro acesso e depois todo mês, o Bud faz algumas perguntas sobre saúde,
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
              Uns 4 minutos · 23 perguntas
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
          <BudButton
            label="Começar"
            onPress={() => {
              setNavDirection('forward');
              setPhase('questions');
            }}
          />
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
            Suas respostas ajudam o Bud a cuidar melhor de você. A próxima pesquisa chega em 30 dias,
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
  const continueLabel = isLast ? 'Enviar' : 'Continuar';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <SurveyHeader
        title="Pesquisa de saúde"
        onBack={goBack}
        progress={progress}
        progressDurationMs={reduceMotion ? DISSOLVE_MS : progressDurationMs}
      />

      <Animated.View style={[{ flex: 1 }, contentAnimStyle]}>
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
                  marginTop: 14,
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
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: questionTop(step.input.type),
              paddingBottom: needsContinue ? KEYBOARD_FOOTER_GAP : bottomPad,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
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
              {step.support ? (
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    lineHeight: 22,
                    color: colors.text2,
                    marginTop: 14,
                  }}
                >
                  {g(step.support)}
                </Text>
              ) : null}
            </View>

            {step.input.type === 'number' ? (
              <View
                style={{ marginTop: 28, paddingHorizontal: 28, flexShrink: 0 }}
                onLayout={(event) => {
                  fieldYRef.current = event.nativeEvent.layout.y;
                }}
              >
                <SurveyField
                  value={numberValue}
                  placeholder={step.input.placeholder}
                  onFocus={scrollFieldIntoView}
                  onChangeText={(next) =>
                    setAnswers((current) => ({ ...current, [step.key]: digitsOnly(next) }))
                  }
                />
              </View>
            ) : null}

            {step.input.type === 'scale' ? (
              <View style={{ marginTop: step.support ? 28 : 62, paddingHorizontal: 24 }}>
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
      </Animated.View>

      {needsContinue ? (
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: KEYBOARD_FOOTER_GAP,
            paddingBottom: bottomPad,
            gap: 14,
            backgroundColor: colors.bg,
          }}
        >
          {saveError ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 20,
                color: colors.text2,
                textAlign: 'center',
              }}
            >
              {saveError}
            </Text>
          ) : null}
          {step.input.type === 'number' && step.input.allowUnknown ? (
            <BudButton
              label="Não sei"
              variant="outline"
              disabled={saving}
              onPress={() =>
                setAnswers((current) => ({ ...current, [step.key]: UNKNOWN_ANSWER }))
              }
            />
          ) : null}
          <BudButton
            label={saveError ? 'Tentar de novo' : continueLabel}
            disabled={!answered}
            loading={saving}
            onPress={goNext}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
