import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BudButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { inferNameVoice } from '@/copy/nameGender';
import {
  applyPersonGenderedCopy,
  relationBondWord,
  relationMapInternalContext,
  relationMapResultText,
} from '@/copy/relationPersonCopy';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  RELATION_FREQUENCY,
  RELATION_ROLES,
  RELATION_TYPES,
  relationRankingItems,
} from '@/pages/activitiesV3/activityFlows';
import {
  ACTIVITY_FEEDBACK_OPTIONS,
  ActivityFlowHeader,
  ActivityIntro,
  ActivityKicker,
  ActivityOptionRow,
  ActivityPrompt,
  ActivityResult,
  ResultEntry,
  type ActivityFeedbackValue,
} from '@/pages/activitiesV3/activityChrome';
import { activityEasing, activityMotion } from '@/pages/activitiesV3/activityMotion';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import {
  generateActivitySynthesis,
  type ActivitySynthesis,
} from '@/services/activityGeneration';
import { activityColors, fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

type Step =
  | 'intro'
  | 'tipo'
  | 'nome'
  | 'idade'
  | 'matriz1'
  | 'ranking'
  | 'papel'
  | 'matriz2'
  | 'frequencia'
  | 'validacao'
  | 'loading'
  | 'result';

const STEPS: Step[] = [
  'tipo',
  'nome',
  'idade',
  'matriz1',
  'ranking',
  'papel',
  'matriz2',
  'frequencia',
  'validacao',
];
const MAP = 360;
const PUCK = 48;
const AXIS_PAD = 46;
const AXIS = MAP / 2;
const TRAVEL = MAP - AXIS_PAD * 2 - PUCK;
const LABEL_BAND = activityMotion.labelBandPx / 2;
const RANK_H = 76;
const RANK_GAP = 10;
const RANK_SLOT = RANK_H + RANK_GAP;
const HANDLE_RING = 36;

function isTextStep(value: Step) {
  return value === 'nome' || value === 'idade';
}

export default function RelationMapScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { g, voice } = useGenderedCopy();
  const intro = ACTIVITY_INTROS.mapa_relacoes;
  const [step, setStep] = useState<Step>('intro');
  const [exitStep, setExitStep] = useState<Step | null>(null);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [awaitingKeyboard, setAwaitingKeyboard] = useState(false);
  const [tipo, setTipo] = useState('');
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [papel, setPapel] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [matriz1, setMatriz1] = useState({ x: 0.5, y: 0.5 });
  const [matriz2, setMatriz2] = useState({ x: 0.5, y: 0.5 });
  const [ranking, setRanking] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [partialReading, setPartialReading] = useState('');
  const [validacao, setValidacao] = useState<ActivityFeedbackValue | null>(null);
  const [synthesis, setSynthesis] = useState<ActivitySynthesis | null>(null);
  const [synthesisFailed, setSynthesisFailed] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedbackValue | null>(null);
  const saveActivity = useRef(createActivityPersister()).current;
  const continuingRef = useRef(false);
  const talkingRef = useRef(false);
  const partialRequestRef = useRef(0);
  const stepDir = useSharedValue(1);
  const stepProgress = useSharedValue(1);
  const stepActive = useSharedValue(0);
  const pageWidth = useSharedValue(windowWidth);
  const textInputRef = useRef<TextInput>(null);
  const fromStepRef = useRef<Step | null>(null);
  const slidingRef = useRef(false);
  const mountedRef = useRef(true);
  const keyboardSubRef = useRef<{ remove: () => void } | null>(null);
  const keyboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const personName = nome.trim();
  const person = personName || 'essa pessoa';
  const personVoice = inferNameVoice(personName);
  const bond = relationBondWord(tipo);
  const mapped = relationMapResultText({
    tipo,
    nome: personName,
    papel,
    frequencia,
    userVoice: voice,
  });
  const stepIndex = STEPS.indexOf(step);
  const progress = stepIndex <= 0 ? 0 : stepIndex / (STEPS.length - 1);

  const rankingItems = useMemo(() => {
    const source = ranking.length ? ranking : relationRankingItems(person, bond);
    return source.map(g);
  }, [bond, g, person, ranking]);

  const clearExit = useCallback(() => {
    slidingRef.current = false;
    setAwaitingKeyboard(false);
    setExitStep(null);
    continuingRef.current = false;
    setContinuing(false);
  }, []);

  const beginSlide = (next: Step, direction: 1 | -1, from: Step) => {
    if (!mountedRef.current) return;
    fromStepRef.current = from;
    slidingRef.current = true;
    pageWidth.value = windowWidth;
    stepDir.value = direction;
    stepProgress.value = 0;
    setSlideDir(direction);
    setExitStep(from);
    setStep(next);
  };

  const animateTo = (next: Step, direction: 1 | -1) => {
    if (next === step || exitStep || slidingRef.current) return false;
    const from = step;
    if (isTextStep(from) && !isTextStep(next) && Keyboard.isVisible()) {
      slidingRef.current = true;
      setAwaitingKeyboard(true);
      keyboardSubRef.current?.remove();
      if (keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        keyboardSubRef.current?.remove();
        keyboardSubRef.current = null;
        if (keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
        keyboardTimerRef.current = null;
        if (!mountedRef.current) return;
        setAwaitingKeyboard(false);
        beginSlide(next, direction, from);
      };
      keyboardSubRef.current = Keyboard.addListener('keyboardDidHide', start);
      keyboardTimerRef.current = setTimeout(start, 420);
      Keyboard.dismiss();
      return true;
    }
    if (isTextStep(from) && !isTextStep(next)) Keyboard.dismiss();
    beginSlide(next, direction, from);
    return true;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      keyboardSubRef.current?.remove();
      if (keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!exitStep) return;
    pageWidth.value = windowWidth;
    stepProgress.value = 0;
    stepActive.value = 1;
    const duration = stepDir.value > 0 ? activityMotion.nextMs : activityMotion.backMs;
    stepProgress.value = withTiming(1, { duration, easing: activityEasing.quick }, (finished) => {
      if (!finished) return;
      stepActive.value = 0;
      stepProgress.value = 1;
      runOnJS(clearExit)();
    });
  }, [clearExit, exitStep, pageWidth, stepActive, stepDir, stepProgress, windowWidth]);

  useLayoutEffect(() => {
    if (!isTextStep(step) || exitStep) return;
    textInputRef.current?.focus();
  }, [exitStep, step]);

  const outgoingStyle = useAnimatedStyle(() => {
    if (stepActive.value === 0) return { transform: [{ translateX: 0 }] };
    const travel = pageWidth.value * stepDir.value;
    return {
      transform: [{ translateX: interpolate(stepProgress.value, [0, 1], [0, -travel]) }],
    };
  });
  const incomingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(stepProgress.value, [0, 1], [0, -pageWidth.value * stepDir.value]),
      },
    ],
  }));

  const goNext = () => {
    if (continuingRef.current || slidingRef.current || exitStep || !canContinue()) return;

    const next = STEPS[stepIndex + 1];
    if (step === 'nome') {
      setRanking(relationRankingItems(nome.trim() || 'essa pessoa', bond));
    }
    if (next === 'validacao') {
      continuingRef.current = true;
      setContinuing(true);
      const requestId = partialRequestRef.current + 1;
      partialRequestRef.current = requestId;
      void (async () => {
        const generated = await generateActivitySynthesis({
          activityId: 'mapa_relacoes',
          answers: {
            modo: 'parcial',
            tipo,
            nome: person,
            idade,
            papel,
            frequencia,
            ranking: rankingItems,
            matriz1,
            matriz2,
          },
          userName: profile?.name,
          gender: profile?.gender,
        });
        if (partialRequestRef.current !== requestId) return;
        setPartialReading(
          generated?.paragrafo ||
            `Olhando ${person}, aparece uma relação que importa — e ainda guarda tensão entre o que você sente e o que consegue mostrar.`,
        );
        if (!animateTo('validacao', 1)) {
          continuingRef.current = false;
          setContinuing(false);
        }
      })();
      return;
    }
    if (next) {
      animateTo(next, 1);
      return;
    }
    setStep('loading');
  };

  const goBack = () => {
    if (exitStep || slidingRef.current) return;
    if (continuingRef.current) {
      partialRequestRef.current += 1;
      continuingRef.current = false;
      setContinuing(false);
    }
    if (stepIndex <= 0) {
      setStep('intro');
      return;
    }
    animateTo(STEPS[stepIndex - 1], -1);
  };

  const canContinue = () => {
    if (step === 'tipo') return Boolean(tipo);
    if (step === 'nome') return Boolean(nome.trim());
    if (step === 'idade') return Boolean(idade.trim());
    if (step === 'papel') return Boolean(papel);
    if (step === 'frequencia') return Boolean(frequencia);
    if (step === 'validacao') return validacao != null;
    return true;
  };

  const resultText = mapped.resultText;
  const internalContext = relationMapInternalContext({
    tipo,
    displayTipo: mapped.displayTipo,
    nome: person,
    idade,
    papel,
    frequencia,
    personVoice: mapped.personVoice,
    userVoice: voice,
  });

  const answersPayload = () => ({
    tipo,
    tipoResolvido: mapped.displayTipo,
    nome: person,
    idade,
    papel,
    frequencia,
    generoNome: mapped.personVoice ?? '',
    ranking: rankingItems,
    matriz1,
    matriz2,
    validacao,
  });

  const persistOnce = async (nextSynthesis = synthesis) => {
    if (!user?.id) return;
    await saveActivity({
      userId: user.id,
      activityId: 'mapa_relacoes',
      answers: answersPayload(),
      resultText: nextSynthesis?.titulo ?? resultText,
      feedback,
    });
  };

  useEffect(() => {
    if (step !== 'loading') return;
    let cancelled = false;
    void (async () => {
      const generated = await generateActivitySynthesis({
        activityId: 'mapa_relacoes',
        answers: answersPayload(),
        userName: profile?.name,
        gender: profile?.gender,
      });
      if (cancelled) return;
      if (!generated) setSynthesisFailed(true);
      else {
        setSynthesis(generated);
        void persistOnce(generated);
      }
      setStep('result');
    })();
    return () => {
      cancelled = true;
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const followUps = synthesis?.perguntas_mais_fundo ?? ACTIVITY_FOLLOWUPS.mapa_relacoes;

  const talk = async (prompt: string) => {
    if (talkingRef.current) return;
    talkingRef.current = true;
    setSaving(true);
    try {
      await persistOnce();
      navigateToChatTab(navigation, {
        chatInsight: {
          insightType: 'activity_mapa_relacoes',
          title: synthesis?.titulo || person,
          contextSummary: synthesis?.paragrafo || resultText,
          internalContext,
          initialUserMessage: prompt,
          contextVariant: 'activity',
          activityType: 'mapa_relacoes',
          badge: 'Mapa de Relações · Resultado',
          cardDescription: synthesis?.paragrafo || resultText,
        },
      });
    } finally {
      talkingRef.current = false;
      setSaving(false);
    }
  };

  const renderStep = (current: Step) => {
    if (current === 'tipo' || current === 'papel' || current === 'frequencia') {
      return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
          <ActivityKicker label="Escolha uma opção" align="left" />
          <View style={{ paddingTop: 12, paddingRight: 4 }}>
            <ActivityPrompt align="left">
              {current === 'tipo'
                ? 'Qual relação você quer olhar hoje?'
                : current === 'papel'
                  ? `No dia a dia, que lugar você ocupa nessa ${bond}?`
                  : `Nos últimos meses, com que frequência você deixou de contar o que estava sentindo?`}
            </ActivityPrompt>
          </View>
          <View style={{ gap: 10, paddingTop: 56 }}>
            {(current === 'tipo' ? RELATION_TYPES : current === 'papel' ? RELATION_ROLES : RELATION_FREQUENCY).map(
              (option) => (
                <ActivityOptionRow
                  key={option}
                  label={applyPersonGenderedCopy(g(option), personVoice)}
                  selected={
                    current === 'tipo'
                      ? tipo === option
                      : current === 'papel'
                        ? papel === option
                        : frequencia === option
                  }
                  onPress={() => {
                    if (current === 'tipo') setTipo(option);
                    else if (current === 'papel') setPapel(option);
                    else setFrequencia(option);
                  }}
                />
              ),
            )}
          </View>
        </ScrollView>
      );
    }

    if (current === 'nome' || current === 'idade') {
      return (
        <View style={{ flex: 1, paddingTop: 88 }}>
          <ActivityPrompt>
            {current === 'nome' ? 'Qual é o nome?' : `Quantos anos ${person} tem?`}
          </ActivityPrompt>
          <TextInput
            ref={current === step ? textInputRef : undefined}
            value={current === 'nome' ? nome : idade}
            onChangeText={current === 'nome' ? setNome : setIdade}
            placeholder={current === 'nome' ? 'Nome' : 'Idade'}
            placeholderTextColor={colors.text3}
            keyboardType={current === 'idade' ? 'number-pad' : 'default'}
            style={{
              marginTop: 78,
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.4,
              color: colors.text,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          />
          <View
            style={{
              height: 2,
              backgroundColor: colors.line,
              marginHorizontal: 90,
              marginTop: 16,
            }}
          />
        </View>
      );
    }

    if (current === 'matriz1' || current === 'matriz2') {
      return (
        <View style={{ flex: 1, paddingTop: 20, paddingHorizontal: 28 }}>
          <ActivityKicker label="Arraste para posicionar" align="left" />
          <View style={{ paddingTop: 12 }}>
            <ActivityPrompt align="left">
              {current === 'matriz1'
                ? `Onde está a sua ${bond} com ${person} agora?`
                : `Quando vocês conversam, quanto você consegue ser você?`}
            </ActivityPrompt>
          </View>
          <View style={{ alignItems: 'center', paddingTop: 36 }}>
            <AxisMap
              value={current === 'matriz1' ? matriz1 : matriz2}
              onChange={current === 'matriz1' ? setMatriz1 : setMatriz2}
              labels={
                current === 'matriz1'
                  ? {
                      top: 'Muito importante',
                      bottom: 'Menos importante',
                      left: 'Menos feliz',
                      right: 'Muito feliz',
                    }
                  : {
                      top: applyPersonGenderedCopy('Ela também se abre', personVoice),
                      bottom: 'Só eu me abro',
                      left: 'Com cuidado',
                      right: 'À vontade',
                    }
              }
            />
          </View>
        </View>
      );
    }

    if (current === 'ranking') {
      return (
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
          <ActivityKicker label="Arraste para reordenar" align="left" />
          <View style={{ paddingTop: 12, paddingRight: 8 }}>
            <ActivityPrompt align="left">{`O que mais importa pra você nessa ${bond}?`}</ActivityPrompt>
          </View>
          <View style={{ paddingTop: 56 }}>
            <RankList items={rankingItems} onChange={setRanking} />
          </View>
        </View>
      );
    }

    if (current === 'validacao') {
      return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
          <ActivityKicker label="Leitura parcial" align="left" />
          <View style={{ paddingTop: 12 }}>
            <ActivityPrompt align="left">Isso faz sentido pra você?</ActivityPrompt>
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              paddingTop: 28,
            }}
          >
            {partialReading || 'Montando a leitura…'}
          </Text>
          <View style={{ gap: 10, paddingTop: 40 }}>
            {ACTIVITY_FEEDBACK_OPTIONS.map((option) => (
              <ActivityOptionRow
                key={option.value}
                label={option.label}
                selected={validacao === option.value}
                onPress={() => setValidacao(option.value)}
              />
            ))}
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  if (step === 'intro') {
    return (
      <ActivityIntro
        copy={intro}
        mist={assets.mapaMist}
        giz={assets.mapaGiz}
        onBack={() => navigation.goBack()}
        onStart={() => setStep('tipo')}
      />
    );
  }

  if (step === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ActivityFlowHeader title="Mapa de Relações" onClose={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <Image
            source={assets.mapaGiz}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 32,
              color: colors.text,
              textAlign: 'center',
              paddingTop: 18,
            }}
          >
            O Bud está pensando nas suas respostas…
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              color: colors.text3,
              paddingTop: 12,
              textAlign: 'center',
            }}
          >
            Você respondeu {STEPS.length} perguntas
          </Text>
        </View>
      </View>
    );
  }

  if (step === 'result') {
    return (
      <ActivityResult
        mist={assets.mapaMist}
        giz={assets.mapaGiz}
        insight={synthesis?.titulo || `Olhar para ${person} já muda o tamanho da relação`}
        body={
          synthesisFailed
            ? 'Não consegui juntar agora. Suas respostas estão salvas — você pode tentar de novo.'
            : synthesis?.paragrafo ||
              `Você escolheu ${g(mapped.displayTipo).toLowerCase()} com ${person}. ${g(papel)}. ${applyPersonGenderedCopy(g(frequencia), mapped.personVoice)}. Isso já é um mapa.`
        }
        sectionLabel="O que mais importa"
        followUps={[...followUps]}
        feedback={feedback}
        onFeedback={(value) => {
          setFeedback(value);
          void persistOnce();
        }}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        <ResultEntry label="Relação" value={`${g(mapped.displayTipo)} · ${person}`} colors={colors} />
        <ResultEntry label="Papel" value={g(papel)} colors={colors} />
        <ResultEntry
          label="Frequência"
          value={applyPersonGenderedCopy(g(frequencia), mapped.personVoice)}
          colors={colors}
        />
        {rankingItems[0] ? (
          <ResultEntry label="O que mais importa" value={rankingItems[0]} colors={colors} />
        ) : null}
      </ActivityResult>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={isTextStep(step) || (exitStep != null && isTextStep(exitStep))}
    >
      <ActivityFlowHeader
        title="Mapa de Relações"
        onBack={goBack}
        onClose={() => navigation.goBack()}
        progress={progress}
      />

      <View style={relationStyles.stage} pointerEvents={exitStep || awaitingKeyboard ? 'none' : 'auto'}>
        <Animated.View style={[{ flex: 1, backgroundColor: colors.bg }, outgoingStyle]}>
          {renderStep(exitStep ?? step)}
        </Animated.View>
        {exitStep ? (
          <Animated.View
            pointerEvents="none"
            style={[
              relationStyles.incoming,
              {
                width: windowWidth,
                left: slideDir * windowWidth,
                backgroundColor: colors.bg,
              },
              incomingStyle,
            ]}
          >
            {renderStep(step)}
          </Animated.View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
        <BudButton
          label="Continuar"
          disabled={!canContinue() || Boolean(exitStep) || awaitingKeyboard}
          loading={continuing}
          onPress={goNext}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function clamp01(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

function puckCenter(pos: number) {
  'worklet';
  return AXIS_PAD + pos * TRAVEL + PUCK / 2;
}

function AxisMap({
  value,
  onChange,
  labels,
}: {
  value: { x: number; y: number };
  onChange: (next: { x: number; y: number }) => void;
  labels: { top: string; bottom: string; left: string; right: string };
}) {
  const colors = useV3Colors();
  const { isDarkMode } = useTheme();
  const posX = useSharedValue(value.x);
  const posY = useSharedValue(value.y);
  const startX = useSharedValue(value.x);
  const startY = useSharedValue(value.y);
  const drag = useSharedValue(0);

  useEffect(() => {
    posX.value = value.x;
    posY.value = value.y;
  }, [posX, posY, value.x, value.y]);

  const commit = useCallback(
    (x: number, y: number) => {
      onChange({ x, y });
    },
    [onChange],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin(() => {
          startX.value = posX.value;
          startY.value = posY.value;
          drag.value = 1;
        })
        .onUpdate((event) => {
          posX.value = clamp01(startX.value + event.translationX / TRAVEL);
          posY.value = clamp01(startY.value + event.translationY / TRAVEL);
        })
        .onFinalize((event) => {
          const settle = { duration: activityMotion.puckSettleMs, easing: activityEasing.gentle };
          const speed = Math.hypot(event.velocityX, event.velocityY);
          let inertiaX = 0;
          let inertiaY = 0;
          if (speed > 1) {
            inertiaX = (event.velocityX / speed) * activityMotion.puckInertiaPx;
            inertiaY = (event.velocityY / speed) * activityMotion.puckInertiaPx;
          }
          const nextX = clamp01(posX.value + inertiaX / TRAVEL);
          const nextY = clamp01(posY.value + inertiaY / TRAVEL);
          posX.value = withTiming(nextX, settle);
          posY.value = withTiming(nextY, settle);
          drag.value = withTiming(0, settle, (finished) => {
            if (finished) runOnJS(commit)(nextX, nextY);
          });
        }),
    [commit, drag, posX, posY, startX, startY],
  );

  const puckStyle = useAnimatedStyle(() => ({
    left: AXIS_PAD + posX.value * TRAVEL,
    top: AXIS_PAD + posY.value * TRAVEL,
    transform: [{ scale: interpolate(drag.value, [0, 1], [1, activityMotion.puckScale]) }],
    shadowOpacity: interpolate(drag.value, [0, 1], [0.12, 0.35]),
    shadowRadius: interpolate(drag.value, [0, 1], [10, 22]),
    elevation: interpolate(drag.value, [0, 1], [3, 10]),
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: drag.value,
    transform: [{ scale: interpolate(drag.value, [0, 1], [0.55, 1]) }],
  }));

  const topStyle = useAnimatedStyle(() => {
    const t = interpolate(
      puckCenter(posY.value),
      [AXIS - LABEL_BAND, AXIS + LABEL_BAND],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { color: interpolateColor(t, [0, 1], [activityColors.ardosia, colors.text2]) };
  });
  const bottomStyle = useAnimatedStyle(() => {
    const t = interpolate(
      puckCenter(posY.value),
      [AXIS - LABEL_BAND, AXIS + LABEL_BAND],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { color: interpolateColor(t, [0, 1], [colors.text2, activityColors.ardosia]) };
  });
  const leftStyle = useAnimatedStyle(() => {
    const t = interpolate(
      puckCenter(posX.value),
      [AXIS - LABEL_BAND, AXIS + LABEL_BAND],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { color: interpolateColor(t, [0, 1], [activityColors.ardosia, colors.text2]) };
  });
  const rightStyle = useAnimatedStyle(() => {
    const t = interpolate(
      puckCenter(posX.value),
      [AXIS - LABEL_BAND, AXIS + LABEL_BAND],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { color: interpolateColor(t, [0, 1], [colors.text2, activityColors.ardosia]) };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={{ width: MAP, height: MAP }}>
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.surface,
            borderRadius: 28,
          }}
        />
        <Animated.Text
          pointerEvents="none"
          style={[axisLabel, { top: 16, width: MAP, textAlign: 'center' }, topStyle]}
        >
          {labels.top}
        </Animated.Text>
        <Animated.Text
          pointerEvents="none"
          style={[axisLabel, { bottom: 16, width: MAP, textAlign: 'center' }, bottomStyle]}
        >
          {labels.bottom}
        </Animated.Text>
        <Animated.Text
          pointerEvents="none"
          style={[axisLabel, { left: 14, top: MAP / 2 - 17, width: 64, textAlign: 'left' }, leftStyle]}
        >
          {labels.left}
        </Animated.Text>
        <Animated.Text
          pointerEvents="none"
          style={[axisLabel, { right: 14, top: MAP / 2 - 17, width: 64, textAlign: 'right' }, rightStyle]}
        >
          {labels.right}
        </Animated.Text>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: MAP / 2,
            top: AXIS_PAD,
            width: 1.5,
            height: 268,
            backgroundColor: colors.line,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: MAP / 2,
            left: AXIS_PAD,
            width: 268,
            height: 1.5,
            backgroundColor: colors.line,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: PUCK,
              height: PUCK,
              borderRadius: 24,
              backgroundColor: activityColors.ardosia,
              borderWidth: isDarkMode ? 3 : 0,
              borderColor: colors.text,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              alignItems: 'center',
              justifyContent: 'center',
            },
            puckStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: activityColors.pinho,
              },
              innerStyle,
            ]}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function EqualHandleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 8.25H17.4167M4.58333 13.75H17.4167"
        stroke={color}
        strokeWidth={1.55833}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RankList({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const activeIndex = useSharedValue(-1);
  const hoverIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const lifting = useSharedValue(0);

  const commit = useCallback(
    (from: number, to: number) => {
      if (from === to) {
        activeIndex.value = -1;
        hoverIndex.value = -1;
        dragY.value = 0;
        lifting.value = 0;
        return;
      }
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
      activeIndex.value = -1;
      hoverIndex.value = -1;
      dragY.value = 0;
      lifting.value = 0;
    },
    [activeIndex, dragY, hoverIndex, items, lifting, onChange],
  );

    return (
      <View style={{ gap: RANK_GAP, width: '100%' }}>
      {items.map((item, index) => (
        <RankRow
          key={item}
          item={item}
          index={index}
          count={items.length}
          activeIndex={activeIndex}
          hoverIndex={hoverIndex}
          dragY={dragY}
          lifting={lifting}
          onCommit={commit}
        />
      ))}
    </View>
  );
}

function RankRow({
  item,
  index,
  count,
  activeIndex,
  hoverIndex,
  dragY,
  lifting,
  onCommit,
}: {
  item: string;
  index: number;
  count: number;
  activeIndex: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  lifting: SharedValue<number>;
  onCommit: (from: number, to: number) => void;
}) {
  const colors = useV3Colors();

  const originY = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .hitSlop(16)
        .onBegin((event) => {
          activeIndex.value = index;
          hoverIndex.value = index;
          originY.value = event.absoluteY;
          dragY.value = 0;
          lifting.value = withTiming(1, {
            duration: activityMotion.reorderMs,
            easing: activityEasing.quick,
          });
        })
        .onUpdate((event) => {
          dragY.value = event.absoluteY - originY.value;
          const draggedCenter = index * RANK_SLOT + RANK_H / 2 + dragY.value;
          const next = Math.min(
            count - 1,
            Math.max(0, Math.round((draggedCenter - RANK_H / 2) / RANK_SLOT)),
          );
          hoverIndex.value = next;
        })
        .onFinalize(() => {
          const from = index;
          const to = hoverIndex.value;
          const target = (to - from) * RANK_SLOT;
          lifting.value = withTiming(0, {
            duration: activityMotion.reorderMs,
            easing: activityEasing.quick,
          });
          dragY.value = withTiming(target, { duration: activityMotion.reorderMs, easing: activityEasing.quick }, (finished) => {
            if (finished) runOnJS(onCommit)(from, to);
          });
        }),
    [activeIndex, count, dragY, hoverIndex, index, lifting, onCommit, originY],
  );

  const rowStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;
    const hover = hoverIndex.value;
    const isActive = active === index;
    let shift = 0;
    if (!isActive && active !== -1) {
      if (active < hover && index > active && index <= hover) shift = -RANK_SLOT;
      if (active > hover && index >= hover && index < active) shift = RANK_SLOT;
    }
    return {
      zIndex: isActive ? 4 : 0,
      transform: [
        { translateY: isActive ? dragY.value : withTiming(shift, { duration: activityMotion.reorderMs, easing: activityEasing.quick }) },
        { scale: isActive ? interpolate(lifting.value, [0, 1], [1, activityMotion.rankScale]) : 1 },
      ],
      shadowOpacity: isActive ? interpolate(lifting.value, [0, 1], [0, 0.18]) : 0,
      shadowRadius: isActive ? interpolate(lifting.value, [0, 1], [0, 16]) : 0,
      elevation: isActive ? interpolate(lifting.value, [0, 1], [0, 8]) : 0,
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: activeIndex.value === index ? lifting.value : 0,
  }));

  const [displayNumber, setDisplayNumber] = useState(index + 1);

  useEffect(() => {
    setDisplayNumber(index + 1);
  }, [index]);

  useAnimatedReaction(
    () => {
      const active = activeIndex.value;
      const hover = hoverIndex.value;
      let visual = index;
      if (active !== -1) {
        if (active === index) visual = hover;
        else if (active < hover && index > active && index <= hover) visual = index - 1;
        else if (active > hover && index >= hover && index < active) visual = index + 1;
      }
      return visual + 1;
    },
    (next, previous) => {
      if (next !== previous) runOnJS(setDisplayNumber)(next);
    },
  );

  return (
    <Animated.View
      style={[
          {
            width: '100%',
            minHeight: RANK_H,
            borderRadius: 20,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
          },
        rowStyle,
      ]}
    >
      <RankNumber value={displayNumber} />
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.sansMedium,
          fontSize: 16,
          lineHeight: 22,
          color: colors.text,
        }}
      >
        {item}
      </Text>
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityRole="button"
          accessibilityLabel="Arrastar para reordenar"
          style={{
            width: 22,
            height: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: HANDLE_RING,
                height: HANDLE_RING,
                borderRadius: HANDLE_RING / 2,
                borderWidth: 1.5,
                borderColor: activityColors.ardosia,
              },
              ringStyle,
            ]}
          />
          <EqualHandleIcon color={colors.text3} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function RankNumber({ value }: { value: number }) {
  const progress = useSharedValue(1);
  const [outgoing, setOutgoing] = useState(value);
  const [incoming, setIncoming] = useState(value);

  useEffect(() => {
    if (value === incoming) return;
    setOutgoing(incoming);
    setIncoming(value);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: activityMotion.reorderMs,
      easing: activityEasing.quick,
    });
  }, [incoming, progress, value]);

  const outStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const inStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={{ width: 20, height: 30 }}>
      <Animated.Text style={[rankNumberText, { position: 'absolute' }, outStyle]}>{outgoing}</Animated.Text>
      <Animated.Text style={[rankNumberText, { position: 'absolute' }, inStyle]}>{incoming}</Animated.Text>
    </View>
  );
}

const relationStyles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
  incoming: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
});

const rankNumberText = {
  fontFamily: fonts.display,
  fontSize: 24,
  lineHeight: 30,
  letterSpacing: -0.4,
  color: activityColors.ardosia,
  width: 20,
};

const axisLabel = {
  position: 'absolute' as const,
  fontFamily: fonts.sansSemi,
  fontSize: 13,
  lineHeight: 17,
};
