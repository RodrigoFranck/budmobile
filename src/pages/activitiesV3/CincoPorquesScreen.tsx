import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  CINCO_PORQUES,
} from '@/pages/activitiesV3/activityFlows';
import {
  ActivityComposer,
  ActivityFlowHeader,
  ActivityIntro,
  ActivityKicker,
  ActivityOptionRow,
  ActivityPrompt,
  ActivityResult,
  LayerGlow,
  PreviousAnswerCard,
  ResultEntry,
  type ActivityFeedbackValue,
} from '@/pages/activitiesV3/activityChrome';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import { useActivityKeyboard } from '@/pages/activitiesV3/useActivityKeyboard';
import {
  generateActivitySynthesis,
  generatePorquesQuestion,
  type ActivitySynthesis,
  type PorquesPair,
  type PorquesQuestionResult,
} from '@/services/activityGeneration';
import { activityColors, fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

const LAYER_GLOW_TOPS = [-60, 52, 164, 276, 388];
const LAYER_GLOW_COLORS = [
  activityColors.menta,
  activityColors.menta,
  activityColors.agua,
  activityColors.agua,
  activityColors.pinho,
];
const GIZ_SIZE = 140;
const GIZ_SPIN_MS = 4800;
const QUESTION_TIMEOUT_MS = 8000;
const M17_MS = 500;
const M17_BACK_MS = 400;
const M17_ENTER = 28;
const FIXED_FIRST = CINCO_PORQUES[0];
const STANDARD = Easing.bezier(0.42, 0, 0.58, 1);

function contentWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.replace(/[^\p{L}\p{N}]/gu, '').length > 0).length;
}

function isVagueAnswer(text: string) {
  const trimmed = text.trim().toLowerCase();
  if (contentWordCount(trimmed) < 4) return true;
  return /^(n[aã]o sei|n sei|sei l[aá]|como assim|nada|sei l[aá]\.?)$/i.test(trimmed);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch(() => null),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function LoadingGiz({ source }: { source: ImageSourcePropType }) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: GIZ_SPIN_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [spin]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Reanimated.Image
      source={source}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: GIZ_SIZE, height: GIZ_SIZE }, style]}
      resizeMode="contain"
    />
  );
}

function LoadingDots({ color }: { color: string }) {
  const a = useSharedValue(0.35);
  const b = useSharedValue(0.35);
  const c = useSharedValue(0.35);

  useEffect(() => {
    const pulse = (delay: number) =>
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: delay }),
          withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
          withTiming(0.35, { duration: 280, easing: Easing.in(Easing.quad) }),
          withTiming(0.35, { duration: 420 }),
        ),
        -1,
        false,
      );
    a.value = pulse(0);
    b.value = pulse(160);
    c.value = pulse(320);
    return () => {
      cancelAnimation(a);
      cancelAnimation(b);
      cancelAnimation(c);
    };
  }, [a, b, c]);

  const styleA = useAnimatedStyle(() => ({ opacity: a.value }));
  const styleB = useAnimatedStyle(() => ({ opacity: b.value }));
  const styleC = useAnimatedStyle(() => ({ opacity: c.value }));
  const dot = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color,
  };

  return (
    <View
      accessibilityLabel="Gerando próxima pergunta"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 32 }}
    >
      <Reanimated.View style={[dot, styleA]} />
      <Reanimated.View style={[dot, styleB]} />
      <Reanimated.View style={[dot, styleC]} />
    </View>
  );
}

export default function CincoPorquesScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [index, setIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const [pairs, setPairs] = useState<PorquesPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(FIXED_FIRST.title);
  const [helpOptions, setHelpOptions] = useState<[string, string] | null>(null);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    nextPairs: PorquesPair[];
    camada: number;
    help?: { respostaAtual: string };
  } | null>(null);
  const [helpUsed, setHelpUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [synthesis, setSynthesis] = useState<ActivitySynthesis | null>(null);
  const [synthesisFailed, setSynthesisFailed] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedbackValue | null>(null);
  const [freshIndex, setFreshIndex] = useState(-1);
  const requestIdRef = useRef(0);
  const saveActivity = useRef(createActivityPersister()).current;
  const { keyboardHeight, keyboardOpen, dismissKeyboard } = useActivityKeyboard();
  const promptShift = useSharedValue(1);
  const promptFrom = useSharedValue(M17_ENTER);
  const intro = ACTIVITY_INTROS.cinco_porques;
  const done = index >= CINCO_PORQUES.length;
  const loading = done && !showResult;
  const glowCount = Math.min((loading ? CINCO_PORQUES.length : pairs.length) + 1, LAYER_GLOW_TOPS.length);
  const layerLabel =
    index <= 0 ? FIXED_FIRST.kicker : `Camada ${Math.min(index + 1, 5)} de 5`;

  const playLayer = (direction: 'forward' | 'back') => {
    promptFrom.value = direction === 'back' ? -M17_ENTER : M17_ENTER;
    promptShift.value = 0;
    promptShift.value = withTiming(1, {
      duration: direction === 'back' ? M17_BACK_MS : M17_MS,
      easing: STANDARD,
    });
  };

  const promptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(promptShift.value, [0.35, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(promptShift.value, [0, 1], [promptFrom.value, 0]) }],
  }));

  const buildAnswersPayload = useCallback(
    (nextPairs = pairs) => ({
      tema_inicial: nextPairs[0]?.resposta ?? '',
      pares: nextPairs,
      feedback: feedback ?? undefined,
    }),
    [feedback, pairs],
  );

  const persistOnce = useCallback(
    async (nextPairs = pairs, nextSynthesis = synthesis) => {
      if (!user?.id) return;
      const resultText =
        nextSynthesis?.titulo ??
        nextPairs.map((pair) => pair.resposta).filter(Boolean).join(' · ');
      await saveActivity({
        userId: user.id,
        activityId: 'cinco_porques',
        answers: buildAnswersPayload(nextPairs),
        resultText,
        feedback,
      });
    },
    [buildAnswersPayload, pairs, saveActivity, synthesis, user?.id],
  );

  const loadSynthesis = useCallback(
    async (nextPairs: PorquesPair[]) => {
      setSynthesisFailed(false);
      const generated = await generateActivitySynthesis({
        activityId: 'cinco_porques',
        answers: {
          tema_inicial: nextPairs[0]?.resposta ?? '',
          pares: nextPairs,
        },
        userName: profile?.name,
        gender: profile?.gender,
      });
      if (!generated) {
        setSynthesisFailed(true);
        setShowResult(true);
        return;
      }
      setSynthesis(generated);
      setShowResult(true);
      if (user?.id) {
        void persistOnce(nextPairs, generated);
      }
    },
    [persistOnce, profile?.name, user?.id],
  );

  useEffect(() => {
    if (!done) {
      setShowResult(false);
      return;
    }
    void loadSynthesis(pairs);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when layers complete

  const applyQuestionResult = (
    result: PorquesQuestionResult,
    help?: { respostaAtual: string },
  ) => {
    setCurrentQuestion(result.pergunta);
    if (help || result.mesma_camada) {
      setHelpUsed(true);
      setHelpOptions(result.opcoes ?? null);
    } else {
      setHelpUsed(false);
      setHelpOptions(null);
    }
  };

  const requestNextQuestion = async (
    nextPairs: PorquesPair[],
    camada: number,
    help?: { respostaAtual: string },
  ) => {
    const requestId = ++requestIdRef.current;
    setPendingRequest({ nextPairs, camada, help });
    setGeneratingQuestion(true);
    setQuestionError(false);
    setHelpOptions(null);

    const attempt = async () => {
      try {
        return await withTimeout(
          generatePorquesQuestion({
            tema_inicial: nextPairs[0]?.resposta ?? '',
            pares: nextPairs,
            camada,
            resposta_atual: help?.respostaAtual,
            pedir_ajuda: Boolean(help),
            gender: profile?.gender,
          }),
          QUESTION_TIMEOUT_MS,
        );
      } catch {
        return null;
      }
    };

    const stale = () => requestId !== requestIdRef.current;

    try {
      let result = await attempt();
      if (stale()) return;

      if (result?.risco) {
        setPendingRequest(null);
        navigation.goBack();
        return;
      }

      if (result?.pergunta) {
        setPendingRequest(null);
        setQuestionError(false);
        applyQuestionResult(result, help);
        return;
      }

      result = await attempt();
      if (stale()) return;

      if (result?.risco) {
        setPendingRequest(null);
        navigation.goBack();
        return;
      }

      if (result?.pergunta) {
        setPendingRequest(null);
        setQuestionError(false);
        applyQuestionResult(result, help);
        return;
      }

      setQuestionError(true);
    } catch {
      if (stale()) return;
      setQuestionError(true);
    } finally {
      if (!stale()) setGeneratingQuestion(false);
    }
  };

  const retryQuestion = () => {
    if (!pendingRequest) return;
    void requestNextQuestion(
      pendingRequest.nextPairs,
      pendingRequest.camada,
      pendingRequest.help,
    );
  };

  const advanceWithAnswer = (answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed || generatingQuestion || questionError) {
      return;
    }
    if (!currentQuestion || currentQuestion === '…') {
      return;
    }

    if (index > 0 && isVagueAnswer(trimmed) && !helpUsed) {
      setHelpUsed(true);
      setHelpOptions(null);
      playLayer('forward');
      void requestNextQuestion(pairs, index + 1, { respostaAtual: trimmed });
      return;
    }

    const nextPairs = [...pairs, { pergunta: currentQuestion, resposta: trimmed }];
    setFreshIndex(nextPairs.length - 1);
    setPairs(nextPairs);
    setDraft('');
    setHelpOptions(null);
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setHelpUsed(false);
    playLayer('forward');

    if (nextIndex >= CINCO_PORQUES.length) {
      return;
    }
    void requestNextQuestion(nextPairs, nextIndex + 1);
  };

  const submit = () => {
    const trimmed = draft.trim();
    if (trimmed.length < 3) return;
    advanceWithAnswer(trimmed);
  };

  const chooseHelpOption = (option: string) => {
    advanceWithAnswer(option);
  };

  const goToPrevious = () => {
    if (index <= 0) return;
    requestIdRef.current += 1;
    setGeneratingQuestion(false);
    setQuestionError(false);
    setPendingRequest(null);
    const previous = pairs[pairs.length - 1];
    const nextPairs = pairs.slice(0, -1);
    setPairs(nextPairs);
    setFreshIndex(-1);
    setDraft(previous?.resposta ?? '');
    setCurrentQuestion(previous?.pergunta ?? FIXED_FIRST.title);
    setHelpOptions(null);
    setIndex((current) => current - 1);
    setHelpUsed(false);
    playLayer('back');
  };

  const first = pairs[0]?.resposta ?? '';
  const last = pairs[pairs.length - 1]?.resposta ?? '';
  const followUps = synthesis?.perguntas_mais_fundo ?? ACTIVITY_FOLLOWUPS.cinco_porques;
  const insight =
    synthesis?.titulo ??
    (last || 'Você chegou mais fundo do que a primeira resposta');
  const body =
    synthesis?.paragrafo ??
    (first && last
      ? `Você saiu de "${first}" e chegou em "${last}". Guarde isso — não precisa resolver agora.`
      : 'Você chegou até o fim. Isso já é um movimento.');

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_cinco_porques',
        title: synthesis?.titulo || last || 'Cinco Porquês',
        contextSummary: body,
        internalContext: pairs.map((pair) => `${pair.pergunta}\n${pair.resposta}`).join('\n\n'),
        initialUserMessage: prompt,
        contextVariant: 'activity',
        activityType: 'cinco_porques',
        badge: 'Cinco Porquês · Resultado',
        cardDescription: body,
      },
    });
  };

  if (index < 0) {
    return (
      <ActivityIntro
        copy={intro}
        mist={assets.mistPorques}
        giz={assets.cincoPorquesGiz}
        onBack={() => navigation.goBack()}
        onStart={() => {
          setIndex(0);
          setCurrentQuestion(FIXED_FIRST.title);
        }}
      />
    );
  }

  if (done && showResult) {
    return (
      <ActivityResult
        mist={assets.mistPorques}
        giz={assets.cincoPorquesGiz}
        insight={insight}
        body={
          synthesisFailed
            ? 'Não consegui juntar agora. Suas respostas estão salvas — você pode tentar de novo.'
            : body
        }
        sectionLabel="Seus cinco porquês"
        followUps={[...followUps]}
        feedback={feedback}
        onFeedback={(value) => {
          setFeedback(value);
          void persistOnce(pairs, synthesis);
        }}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        {synthesisFailed ? (
          <View style={{ paddingTop: 18 }}>
            <Text
              onPress={() => {
                setShowResult(false);
                void loadSynthesis(pairs);
              }}
              style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.accent }}
            >
              Tentar de novo
            </Text>
          </View>
        ) : null}
        {pairs.map((pair, i) => (
          <ResultEntry
            key={`${pair.pergunta}-${i}`}
            label={i === 0 ? 'Pensamento inicial' : pair.pergunta}
            value={pair.resposta}
            colors={colors}
          />
        ))}
      </ActivityResult>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
      }}
    >
      {LAYER_GLOW_TOPS.slice(0, glowCount).map((top, i) => (
        <LayerGlow key={`glow-${i}`} id={`porques-glow-${i}`} color={LAYER_GLOW_COLORS[i]} top={top} />
      ))}
      <ActivityFlowHeader
        title="Cinco Porquês"
        onBack={index > 0 && !loading ? goToPrevious : undefined}
        onClose={() => navigation.goBack()}
      />
      {loading ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 12, paddingBottom: 16 }}
          >
            {pairs.map((pair, i) => (
              <PreviousAnswerCard
                key={`${pair.pergunta}-load-${i}`}
                question={i === 0 ? FIXED_FIRST.title : pair.pergunta}
                answer={pair.resposta}
              />
            ))}
          </ScrollView>
          <View
            style={{
              alignItems: 'center',
              paddingBottom: Math.max(insets.bottom, 24),
            }}
          >
            <LoadingGiz source={assets.cincoPorquesGiz} />
            <Text
              style={{
                fontFamily: fonts.sansMedium,
                fontSize: 15,
                lineHeight: 15,
                color: colors.text3,
                paddingTop: 8,
              }}
            >
              Juntando as suas respostas…
            </Text>
          </View>
        </>
      ) : (
        <>
          {pairs.length > 0 ? (
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={dismissKeyboard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 16,
                gap: 12,
                paddingBottom: 12,
                flexGrow: 1,
              }}
            >
              {pairs.map((pair, originalIndex) => (
                <PorquesStackCard
                  key={`${originalIndex}-${pair.pergunta}`}
                  question={originalIndex === 0 ? FIXED_FIRST.title : pair.pergunta}
                  answer={pair.resposta}
                  fresh={originalIndex === freshIndex}
                />
              ))}
            </ScrollView>
          ) : null}
          <Pressable
            onPress={dismissKeyboard}
            accessible={false}
            style={pairs.length ? undefined : { flex: 1 }}
          >
            <Reanimated.View style={[{ paddingTop: pairs.length ? 12 : 32, paddingBottom: 12 }, promptStyle]}>
              <ActivityKicker label={layerLabel} />
              <View
                style={{
                  paddingHorizontal: 36,
                  paddingTop: pairs.length ? (keyboardOpen ? 12 : 20) : 28,
                }}
              >
                {generatingQuestion ? (
                  <LoadingDots color={colors.text3} />
                ) : questionError ? (
                  <View style={{ alignItems: 'center', gap: 14 }}>
                    <Text
                      style={{
                        fontFamily: fonts.display,
                        fontSize: 26,
                        lineHeight: 32,
                        letterSpacing: -0.4,
                        color: colors.text,
                        textAlign: 'center',
                      }}
                    >
                      Não consegui continuar agora
                    </Text>
                    <Pressable
                      onPress={retryQuestion}
                      accessibilityRole="button"
                      accessibilityLabel="Tentar de novo"
                    >
                      <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.accent }}>
                        Tentar de novo
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <ActivityPrompt>{currentQuestion}</ActivityPrompt>
                )}
              </View>
              {helpOptions && !generatingQuestion && !questionError ? (
                <View style={{ gap: 10, paddingHorizontal: 20, paddingTop: 20 }}>
                  {helpOptions.map((option) => (
                    <ActivityOptionRow
                      key={option}
                      label={option}
                      onPress={() => chooseHelpOption(option)}
                    />
                  ))}
                </View>
              ) : null}
            </Reanimated.View>
          </Pressable>
          <ActivityComposer
            value={draft}
            onChangeText={setDraft}
            onSend={submit}
            placeholder="Escreva aqui…"
            disabled={generatingQuestion || questionError}
            bottomInset={keyboardOpen ? 12 : undefined}
          />
        </>
      )}
    </View>
  );
}

function PorquesStackCard({
  question,
  answer,
  fresh,
}: {
  question: string;
  answer: string;
  fresh: boolean;
}) {
  const colors = useV3Colors();
  const progress = useSharedValue(fresh ? 0 : 1);

  useEffect(() => {
    if (!fresh) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: M17_MS, easing: STANDARD });
  }, [fresh, progress]);

  const box = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1]) }],
  }));
  const copy = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.7, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Reanimated.View style={box}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Reanimated.Text
          style={[
            {
              fontFamily: fonts.sansMedium,
              fontSize: 13,
              lineHeight: 18,
              color: colors.text3,
            },
            copy,
          ]}
        >
          {question}
        </Reanimated.Text>
        <Reanimated.Text
          style={[
            {
              fontFamily: fonts.sansMedium,
              fontSize: 16,
              lineHeight: 23,
              color: colors.text,
              paddingTop: 6,
            },
            copy,
          ]}
        >
          {answer}
        </Reanimated.Text>
      </View>
    </Reanimated.View>
  );
}
