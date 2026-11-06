import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  FIEE_DIMENSIONS,
  shuffleFieeWords,
  type FieeWord,
} from '@/pages/activitiesV3/activityFlows';
import {
  ActivityFlowHeader,
  ActivityIntro,
  ActivityKicker,
  ActivityPrompt,
  ActivityResult,
  LayerGlow,
  ResultEntry,
  type ActivityFeedbackValue,
} from '@/pages/activitiesV3/activityChrome';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import { useActivityKeyboard } from '@/pages/activitiesV3/useActivityKeyboard';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import {
  classifyFieeWord,
  generateActivitySynthesis,
  type ActivitySynthesis,
} from '@/services/activityGeneration';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

type FieeAnswer = {
  palavra: string;
  livre: boolean;
  valencia: -1 | 0 | 1;
  valencia_origem: 'tabela' | 'ia';
};

const ASK_LEAF = 128;
const LOAD_SCALE = 150 / ASK_LEAF;
const LOADING_MS = 2200;
const LOAD_SPIN_MS = 1800;
const M18_MS = motion.optionMs;
const M19_CENTER_MS = motion.questionStepMs;
const M19_HOLD_MS = motion.fieeHoldMs;
const M19_SPIN_MS = motion.sproutSpinMs;
const CHIP_LABEL = '#171311';
const WORD_RISE = -36;
const WORD_LINE = 40;
const WORD_SLOT_PAD_TOP = 18;
const WORD_SLOT_PAD_BOTTOM = 16;
const WORD_SLOT_H = WORD_SLOT_PAD_TOP + WORD_LINE + WORD_SLOT_PAD_BOTTOM;
const CHIPS_PAD_TOP = 28;
const PAGE_ENTER = 20;
const RESULT_LABELS = ['Fisicamente', 'Na cabeça', 'Por dentro', 'Com as pessoas'] as const;

const QUICK = Easing.bezier(0.2, 0, 0, 1);
const STANDARD = Easing.bezier(0.42, 0, 0.58, 1);

const PHASE_ASK = 0;
const PHASE_COMMIT = 1;
const PHASE_SPIN = 2;
const PHASE_LOAD = 3;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Phase = 'ask' | 'commit' | 'spin' | 'loading';

export default function FieeScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { keyboardHeight, keyboardOpen, dismissKeyboard } = useActivityKeyboard();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { g } = useGenderedCopy();
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, FieeAnswer>>({});
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>('ask');
  const [showResult, setShowResult] = useState(false);
  const [centeredWord, setCenteredWord] = useState('');
  const [chipSet, setChipSet] = useState<FieeWord[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [synthesis, setSynthesis] = useState<ActivitySynthesis | null>(null);
  const [synthesisFailed, setSynthesisFailed] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedbackValue | null>(null);
  const saveActivity = useRef(createActivityPersister()).current;
  const lineRef = useRef<TextInput>(null);
  const busy = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const intro = ACTIVITY_INTROS.fiee;
  const step = index >= 0 && index < FIEE_DIMENSIONS.length ? FIEE_DIMENSIONS[index] : null;
  const selected = step ? answers[step.key] : undefined;
  const asking = phase === 'ask';
  const compass = ASK_LEAF * 2;
  const glowIndex = phase === 'spin' ? Math.max(0, index - 1) : Math.max(0, index);
  const glowColor = FIEE_DIMENSIONS[glowIndex]?.color ?? colors.accent;
  // Chip selection always fills the line; free text needs 2+ chars (TF-70).
  const canAdvance = customDraft.trim().length >= 2;

  const selectProgress = useSharedValue(0);
  const commitProgress = useSharedValue(0);
  const enterProgress = useSharedValue(0);
  const loadProgress = useSharedValue(0);
  const animPhase = useSharedValue(PHASE_ASK);
  const spinDeg = useSharedValue(0);
  const loadSpin = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const slotY = useSharedValue(156);
  const fill0 = useSharedValue(0);
  const fill1 = useSharedValue(0);
  const fill2 = useSharedValue(0);
  const fill3 = useSharedValue(0);
  const outline0 = useSharedValue(0.95);
  const outline1 = useSharedValue(0.35);
  const outline2 = useSharedValue(0.35);
  const outline3 = useSharedValue(0.35);
  const fills = [fill0, fill1, fill2, fill3];
  const outlines = [outline0, outline1, outline2, outline3];

  const displayFiee = (value: string | undefined) => {
    if (!value) return '';
    return g(value);
  };
  const result = FIEE_DIMENSIONS.map((dimension) => displayFiee(answers[dimension.key]?.palavra))
    .filter(Boolean)
    .join(' · ');
  const wordText =
    centeredWord ||
    (step && selected ? displayFiee(selected.palavra) : '') ||
    (customDraft.trim().length >= 2 ? customDraft.trim() : '');

  useEffect(() => {
    if (!step) return;
    setChipSet(shuffleFieeWords(step.words));
  }, [step?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!step || phase !== 'ask') return;
    const existing = answersRef.current[step.key];
    setCustomDraft(existing ? displayFiee(existing.palavra) : '');
  }, [phase, step?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistOnce = async (nextAnswers = answers, nextSynthesis = synthesis) => {
    if (!user?.id) return;
    const text =
      nextSynthesis?.titulo ??
      FIEE_DIMENSIONS.map((dimension) => nextAnswers[dimension.key]?.palavra)
        .filter(Boolean)
        .join(' · ');
    await saveActivity({
      userId: user.id,
      activityId: 'fiee',
      answers: nextAnswers as unknown as Record<string, unknown>,
      resultText: text,
      feedback,
    });
  };

  const loadSynthesis = async (nextAnswers: Record<string, FieeAnswer>) => {
    setSynthesisFailed(false);
    const generated = await generateActivitySynthesis({
      activityId: 'fiee',
      answers: nextAnswers as unknown as Record<string, unknown>,
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
    void persistOnce(nextAnswers, generated);
  };

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    cancelAnimation(loadSpin);
  };

  useEffect(() => () => clearHold(), []);

  useEffect(() => {
    if (phase !== 'ask') return;
    selectProgress.value = withTiming(selected ? 1 : 0, { duration: M18_MS, easing: QUICK });
  }, [phase, selectProgress, selected]);

  const finishSpin = () => {
    busy.current = false;
    setPhase('ask');
    setCenteredWord('');
    animPhase.value = PHASE_ASK;
    commitProgress.value = 0;
    enterProgress.value = 0;
    glowProgress.value = 0;
    selectProgress.value = 0;
  };

  const startSpin = (from: number) => {
    const next = from + 1;
    setPhase('spin');
    animPhase.value = PHASE_SPIN;
    enterProgress.value = 0;
    enterProgress.value = withTiming(1, { duration: M19_SPIN_MS, easing: STANDARD });
    outlines[next].value = withTiming(0.95, { duration: M19_SPIN_MS, easing: STANDARD });
    glowProgress.value = withTiming(0, { duration: M19_SPIN_MS, easing: STANDARD });
    holdTimer.current = setTimeout(() => setIndex(next), M19_SPIN_MS * 0.5);
    spinDeg.value = withTiming(next * 90, { duration: M19_SPIN_MS, easing: STANDARD }, (finished) => {
      if (finished) runOnJS(finishSpin)();
    });
  };

  const startLoading = (nextAnswers: Record<string, FieeAnswer>) => {
    setPhase('loading');
    animPhase.value = PHASE_LOAD;
    loadProgress.value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    glowProgress.value = withTiming(0, { duration: M19_CENTER_MS, easing: STANDARD });
    fills.forEach((fill) => {
      fill.value = withTiming(1, { duration: M18_MS, easing: QUICK });
    });
    outlines.forEach((outline) => {
      outline.value = withTiming(0, { duration: M18_MS, easing: QUICK });
    });
    loadSpin.value = 0;
    loadSpin.value = withRepeat(
      withTiming(360, { duration: LOAD_SPIN_MS, easing: Easing.linear }),
      -1,
      false,
    );
    holdTimer.current = setTimeout(() => {
      cancelAnimation(loadSpin);
      busy.current = false;
      void loadSynthesis({ ...nextAnswers, ...answersRef.current });
    }, LOADING_MS);
  };

  const goNext = () => {
    if (!step || !asking || busy.current || !canAdvance) return;
    Keyboard.dismiss();
    busy.current = true;
    const from = index;
    const draftWord = customDraft.trim();
    const fromChip = Boolean(selected && !selected.livre && selected.palavra);
    let nextAnswers = answers;
    let displayWord = '';

    if (fromChip && selected) {
      displayWord = displayFiee(selected.palavra);
      nextAnswers = answers;
    } else if (draftWord.length >= 2) {
      displayWord = draftWord;
      const entry: FieeAnswer = {
        palavra: draftWord,
        livre: true,
        valencia: 0,
        valencia_origem: 'ia',
      };
      nextAnswers = { ...answers, [step.key]: entry };
      setAnswers(nextAnswers);
      void classifyFieeWord(draftWord).then((classified) => {
        if (!classified) return;
        setAnswers((current) => {
          const currentEntry = current[step.key];
          if (!currentEntry || currentEntry.palavra !== draftWord || !currentEntry.livre) {
            return current;
          }
          return {
            ...current,
            [step.key]: {
              ...currentEntry,
              valencia: classified.valencia,
              valencia_origem: 'ia',
            },
          };
        });
      });
    } else {
      busy.current = false;
      return;
    }

    setCenteredWord(displayWord);
    setPhase('commit');
    animPhase.value = PHASE_COMMIT;
    commitProgress.value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    glowProgress.value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    fills[from].value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    outlines[from].value = withTiming(0, { duration: M19_CENTER_MS, easing: STANDARD });

    if (from >= FIEE_DIMENSIONS.length - 1) {
      holdTimer.current = setTimeout(() => startLoading(nextAnswers), M19_CENTER_MS + M19_HOLD_MS);
      return;
    }
    holdTimer.current = setTimeout(() => startSpin(from), M19_CENTER_MS + M19_HOLD_MS);
  };

  const finishBack = (next: number) => {
    setIndex(next);
    setPhase('ask');
    animPhase.value = PHASE_ASK;
    enterProgress.value = 0;
    commitProgress.value = 0;
    selectProgress.value = 1;
    busy.current = false;
  };

  const goBack = () => {
    if (index <= 0 || !asking || busy.current) return;
    busy.current = true;
    const from = index;
    const next = from - 1;
    setPhase('spin');
    animPhase.value = PHASE_SPIN;
    enterProgress.value = 1;
    enterProgress.value = withTiming(0, { duration: M18_MS, easing: QUICK });
    fills[next].value = withTiming(0, { duration: M19_SPIN_MS, easing: STANDARD });
    outlines[next].value = withTiming(0.95, { duration: M19_SPIN_MS, easing: STANDARD });
    outlines[from].value = withTiming(0.35, { duration: M19_SPIN_MS, easing: STANDARD });
    spinDeg.value = withTiming(next * 90, { duration: M19_SPIN_MS, easing: STANDARD }, (finished) => {
      if (finished) runOnJS(finishBack)(next);
    });
  };

  const followUps = synthesis?.perguntas_mais_fundo ?? ACTIVITY_FOLLOWUPS.fiee;

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_fiee',
        title: synthesis?.titulo || result || 'FIEE?',
        contextSummary: synthesis?.paragrafo || result,
        internalContext: result,
        initialUserMessage: prompt,
        contextVariant: 'activity',
        activityType: 'fiee',
        badge: 'FIEE? · Resultado',
        cardDescription: synthesis?.paragrafo || result,
      },
    });
  };

  const selectWord = (word: FieeWord) => {
    if (!asking || !step) return;
    const label = displayFiee(word.label);
    setCustomDraft(label);
    setAnswers((current) => ({
      ...current,
      [step.key]: {
        palavra: word.label,
        livre: false,
        valencia: word.valence,
        valencia_origem: 'tabela',
      },
    }));
  };

  const onChangeLine = (text: string) => {
    if (!asking || !step) return;
    setCustomDraft(text);
    setAnswers((current) => {
      const existing = current[step.key];
      if (!existing) return current;
      // Typing clears a chip pick; keep a free-text draft as line-only until Próximo.
      const next = { ...current };
      delete next[step.key];
      return next;
    });
  };

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinDeg.value + loadSpin.value}deg` }],
  }));
  const compassScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(loadProgress.value, [0, 1], [1, LOAD_SCALE]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(glowProgress.value, [0, 1], [560, 40]) }],
    opacity:
      interpolate(glowProgress.value, [0, 1], [0.22, 0.3]) *
      interpolate(loadProgress.value, [0, 1], [1, 0]),
  }));
  const askStyle = useAnimatedStyle(() => {
    const commitFade = interpolate(commitProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP);
    const enterOpacity = interpolate(enterProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP);
    const enterY = interpolate(enterProgress.value, [0.5, 1], [PAGE_ENTER, 0], Extrapolation.CLAMP);
    const phase = animPhase.value;
    const opacity =
      phase === PHASE_COMMIT ? commitFade : phase === PHASE_SPIN ? enterOpacity : phase === PHASE_LOAD ? 0 : 1;
    const translateY = phase === PHASE_SPIN ? enterY : 0;
    return { opacity, transform: [{ translateY }] };
  });
  const wordStyle = useAnimatedStyle(() => {
    const size = interpolate(commitProgress.value, [0, 1], [34, 26]);
    const spinFade = interpolate(enterProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP);
    const loadFade = interpolate(loadProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP);
    const rise = interpolate(commitProgress.value, [0, 1], [0, WORD_RISE]);
    const phase = animPhase.value;
    const opacity =
      phase === PHASE_ASK ? 0 : phase === PHASE_LOAD ? loadFade : phase === PHASE_COMMIT ? 1 : spinFade;
    return {
      top: slotY.value,
      fontSize: size,
      lineHeight: interpolate(commitProgress.value, [0, 1], [40, 32]),
      color: interpolateColor(commitProgress.value, [0, 1], [colors.text, colors.text2]),
      opacity,
      transform: [{ translateY: rise }],
    };
  });
  const lineFieldStyle = useAnimatedStyle(() => {
    const commitFade = interpolate(commitProgress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP);
    const phase = animPhase.value;
    return { opacity: phase === PHASE_ASK ? 1 : phase === PHASE_COMMIT ? commitFade : 0 };
  });
  const loadingCopyStyle = useAnimatedStyle(() => ({
    opacity: loadProgress.value,
  }));

  if (index < 0) {
    return (
      <ActivityIntro
        copy={intro}
        mist={assets.fieeMist}
        giz={assets.fieeGiz}
        onBack={() => navigation.goBack()}
        onStart={() => setIndex(0)}
      />
    );
  }

  if (showResult) {
    const insight =
      synthesis?.titulo ||
      FIEE_DIMENSIONS.map((item) => displayFiee(answers[item.key]?.palavra))
        .filter(Boolean)
        .join(', ') ||
      'Seu check-in';
    return (
      <ActivityResult
        mist={assets.fieeMist}
        giz={assets.fieeGiz}
        insight={insight}
        body={
          synthesisFailed
            ? 'Não consegui juntar agora. Suas respostas estão salvas — você pode tentar de novo.'
            : synthesis?.paragrafo ||
              (result
                ? `${result} contam a história de como você está agora. Guarde o quadro inteiro, não só o que grita mais alto.`
                : 'Você passou pelas quatro dimensões. Guarde o que apareceu.')
        }
        sectionLabel="Seu check-in"
        followUps={[...followUps]}
        feedback={feedback}
        onFeedback={(value) => {
          setFeedback(value);
          void persistOnce(answers, synthesis);
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
                void loadSynthesis(answers);
              }}
              style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.accent }}
            >
              Tentar de novo
            </Text>
          </View>
        ) : null}
        {FIEE_DIMENSIONS.map((dimension, i) =>
          answers[dimension.key] ? (
            <ResultEntry
              key={dimension.key}
              label={RESULT_LABELS[i]}
              value={displayFiee(answers[dimension.key]?.palavra)}
              colors={colors}
            />
          ) : null,
        )}
      </ActivityResult>
    );
  }

  const leaves = [
    { key: 'fisico', fill: assets.fieeLeafFisico, x: 64, y: 128, rotate: '0deg', fillOp: fill0, outlineOp: outline0 },
    { key: 'intelectual', fill: assets.fieeLeafIntelectual, x: 128, y: 64, rotate: '-90deg', fillOp: fill1, outlineOp: outline1 },
    { key: 'emocional', fill: assets.fieeLeafEmocional, x: 64, y: 0, rotate: '180deg', fillOp: fill2, outlineOp: outline2 },
    { key: 'social', fill: assets.fieeLeafSocial, x: 0, y: 64, rotate: '90deg', fillOp: fill3, outlineOp: outline3 },
  ] as const;

  const keyboardPad = Platform.OS === 'ios' ? keyboardHeight : 0;
  const headerBlock = insets.top + 56;
  const slotPadTop = keyboardOpen ? 4 : WORD_SLOT_PAD_TOP;
  const slotPadBottom = keyboardOpen ? 4 : WORD_SLOT_PAD_BOTTOM;
  const slotHeight = keyboardOpen ? slotPadTop + WORD_LINE + slotPadBottom : WORD_SLOT_H;
  const chipsPadTop = keyboardOpen ? 8 : CHIPS_PAD_TOP;
  const dock = slotHeight + 40 + chipsPadTop + 58 + (keyboardOpen ? 8 : 28);
  const questionBlock = keyboardOpen ? 96 : 160;
  const sproutRoom = windowHeight - keyboardPad - headerBlock - dock - questionBlock;
  const sproutBox = keyboardOpen ? Math.max(0, Math.min(compass, sproutRoom)) : compass;
  const sproutScale = keyboardOpen && sproutBox > 0 ? Math.min(1, sproutBox / compass) : 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        paddingBottom: keyboardPad,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center' }, glowStyle]}
      >
        <LayerGlow id="fiee-glow" color={glowColor} top={0} size={840} opacity={1} />
      </Animated.View>

      <ActivityFlowHeader
        title="FIEE?"
        onBack={index > 0 && phase !== 'loading' ? goBack : undefined}
        onClose={() => navigation.goBack()}
      />

      <View
        style={{
          height: keyboardOpen ? sproutBox : undefined,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: keyboardOpen ? 0 : 30,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            { width: compass, height: compass },
            compassScaleStyle,
            keyboardOpen ? { transform: [{ scale: sproutScale }] } : null,
          ]}
        >
          <Animated.View
            collapsable={false}
            style={[{ width: compass, height: compass }, spinStyle]}
          >
            {leaves.map((item) => (
              <CompassLeaf
                key={item.key}
                outline={assets.fieeLeafOutline}
                fill={item.fill}
                left={item.x}
                top={item.y}
                rotate={item.rotate}
                size={ASK_LEAF}
                fillOpacity={item.fillOp}
                outlineOpacity={item.outlineOp}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingTop: 102, zIndex: 1 },
            loadingCopyStyle,
          ]}
        >
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
            Lendo o seu check-in…
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 15,
              color: colors.text3,
              paddingTop: 14,
            }}
          >
            Isso leva só um instante
          </Text>
        </Animated.View>

        <Animated.Text
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: fonts.display,
              letterSpacing: -0.4,
              zIndex: 2,
            },
            wordStyle,
          ]}
        >
          {wordText}
        </Animated.Text>

        <Animated.View
          pointerEvents={asking ? 'auto' : 'none'}
          style={[{ flex: 1 }, askStyle]}
        >
          <Pressable onPress={dismissKeyboard} accessible={false}>
            <View style={{ paddingTop: keyboardOpen ? 8 : 48 }}>
              <ActivityKicker label={step?.title ?? ''} />
              <View style={{ paddingHorizontal: 40, paddingTop: keyboardOpen ? 6 : 14 }}>
                {keyboardOpen ? (
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 20,
                      lineHeight: 26,
                      letterSpacing: -0.4,
                      color: colors.text,
                      textAlign: 'center',
                    }}
                  >
                    {g(step?.prompt ?? '')}
                  </Text>
                ) : (
                  <ActivityPrompt>{step?.prompt ?? ''}</ActivityPrompt>
                )}
              </View>
            </View>
          </Pressable>

          <View
            collapsable={false}
            onLayout={(event) => {
              slotY.value = event.nativeEvent.layout.y + slotPadTop;
            }}
            style={{
              height: slotHeight,
              justifyContent: 'flex-end',
              paddingBottom: slotPadBottom,
              paddingHorizontal: 60,
            }}
          >
            <Animated.View style={lineFieldStyle}>
              <TextInput
                ref={lineRef}
                value={customDraft}
                onChangeText={onChangeLine}
                editable={asking}
                placeholder=""
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={goNext}
                accessibilityLabel="Escreva ou escolha uma palavra"
                style={{
                  fontFamily: fonts.display,
                  fontSize: keyboardOpen ? 22 : 26,
                  lineHeight: keyboardOpen ? 28 : WORD_LINE,
                  letterSpacing: -0.4,
                  color: colors.text,
                  textAlign: 'center',
                  paddingVertical: 0,
                }}
              />
            </Animated.View>
          </View>

          <Pressable
            onPress={() => lineRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="Campo para digitar a palavra"
            style={{
              height: 1.5,
              backgroundColor: colors.line,
              marginHorizontal: 60,
            }}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={dismissKeyboard}
            contentContainerStyle={{
              gap: 8,
              paddingLeft: 24,
              paddingRight: 16,
              paddingTop: chipsPadTop,
              alignItems: 'center',
            }}
            style={{ flexGrow: 0 }}
          >
            {chipSet.map((word) => (
              <FieeChip
                key={word.label}
                label={displayFiee(word.label)}
                selected={selected?.palavra === word.label && !selected?.livre}
                dimmed={Boolean(selected && !selected.livre) && selected?.palavra !== word.label}
                color={step?.color ?? colors.accent}
                labelColor={CHIP_LABEL}
                restingColor={colors.surface2}
                restingLabel={colors.text}
                onPress={() => selectWord(word)}
              />
            ))}
          </ScrollView>

          <View style={{ flex: keyboardOpen ? 0 : 1 }} />

          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: keyboardOpen ? 8 : Math.max(insets.bottom, 16) + 12,
            }}
          >
            <FieeNextButton enabled={canAdvance} onPress={goNext} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function FieeChip({
  label,
  selected,
  dimmed,
  color,
  labelColor,
  restingColor,
  restingLabel,
  onPress,
}: {
  label: string;
  selected: boolean;
  dimmed: boolean;
  color: string;
  labelColor: string;
  restingColor: string;
  restingLabel: string;
  onPress: () => void;
}) {
  const dim = useSharedValue(dimmed ? 1 : 0);
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    dim.value = withTiming(dimmed ? 1 : 0, { duration: M18_MS, easing: QUICK });
    on.value = withTiming(selected ? 1 : 0, { duration: M18_MS, easing: QUICK });
  }, [dim, dimmed, on, selected]);
  const wrap = useAnimatedStyle(() => ({
    opacity: interpolate(dim.value, [0, 1], [1, 0.4]),
    backgroundColor: interpolateColor(on.value, [0, 1], [restingColor, color]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [restingLabel, labelColor]),
  }));
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        {
          paddingHorizontal: 16,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        wrap,
      ]}
    >
      <Animated.Text style={[{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 15 }, textStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function FieeNextButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  const colors = useV3Colors();
  const progress = useSharedValue(enabled ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(enabled ? 1 : 0, { duration: M18_MS, easing: QUICK });
  }, [enabled, progress]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface2, colors.btn]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.text3, colors.onBtn]),
  }));
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      style={[
        {
          height: 58,
          borderRadius: 29,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.Text
        style={[{ fontFamily: fonts.sansSemi, fontSize: 17, lineHeight: 22 }, textStyle]}
      >
        Próximo
      </Animated.Text>
    </AnimatedPressable>
  );
}

function CompassLeaf({
  outline,
  fill,
  left,
  top,
  rotate,
  size,
  fillOpacity,
  outlineOpacity,
}: {
  outline: ImageSourcePropType;
  fill: ImageSourcePropType;
  left: number;
  top: number;
  rotate: string;
  size: number;
  fillOpacity: SharedValue<number>;
  outlineOpacity: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({ opacity: fillOpacity.value }));
  const outlineStyle = useAnimatedStyle(() => ({ opacity: outlineOpacity.value }));
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        transform: [{ rotate }],
      }}
    >
      <Animated.View style={[leafImage, { width: size, height: size }, fillStyle]}>
        <Animated.Image
          source={fill}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      </Animated.View>
      <Animated.View style={[leafImage, { width: size, height: size }, outlineStyle]}>
        <Animated.Image
          source={outline}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      </Animated.View>
    </View>
  );
}

const leafImage = {
  position: 'absolute' as const,
  left: 0,
  top: 0,
};
