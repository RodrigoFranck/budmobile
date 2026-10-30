import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type ImageSourcePropType } from 'react-native';
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

import { BudChip } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  FIEE_DIMENSIONS,
} from '@/pages/activitiesV3/activityFlows';
import {
  ActivityFlowHeader,
  ActivityIntro,
  ActivityKicker,
  ActivityPrompt,
  ActivityResult,
  LayerGlow,
  ResultEntry,
} from '@/pages/activitiesV3/activityChrome';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

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
const PAGE_ENTER = 20;
const RESULT_LABELS = ['Fisicamente', 'Na cabeça', 'Por dentro', 'Com as pessoas'] as const;

const QUICK = Easing.bezier(0.25, 0, 0, 1);
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
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const { g } = useGenderedCopy();
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>('ask');
  const [showResult, setShowResult] = useState(false);
  const [centeredWord, setCenteredWord] = useState('');
  const saveActivity = useRef(createActivityPersister()).current;
  const busy = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intro = ACTIVITY_INTROS.fiee;
  const step = index >= 0 && index < FIEE_DIMENSIONS.length ? FIEE_DIMENSIONS[index] : null;
  const selected = step ? answers[step.key] : undefined;
  const asking = phase === 'ask';
  const compass = ASK_LEAF * 2;
  const glowIndex = phase === 'spin' ? Math.max(0, index - 1) : Math.max(0, index);
  const glowColor = FIEE_DIMENSIONS[glowIndex]?.color ?? colors.accent;

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

  const displayFiee = (key: string, value: string | undefined) => {
    if (!value) return '';
    return key === 'intelectual' ? value : g(value);
  };
  const result = FIEE_DIMENSIONS.map((dimension) => displayFiee(dimension.key, answers[dimension.key]))
    .filter(Boolean)
    .join(' · ');
  const wordText = centeredWord || (step && selected ? displayFiee(step.key, selected) : '');

  const persistOnce = async (nextAnswers = answers) => {
    if (!user?.id) return;
    const text = FIEE_DIMENSIONS.map((dimension) => nextAnswers[dimension.key])
      .filter(Boolean)
      .join(' · ');
    await saveActivity({
      userId: user.id,
      activityId: 'fiee',
      answers: nextAnswers,
      resultText: text,
    });
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
    setIndex(next);
    animPhase.value = PHASE_SPIN;
    enterProgress.value = 0;
    enterProgress.value = withTiming(1, { duration: M19_SPIN_MS, easing: STANDARD });
    outlines[next].value = withTiming(0.95, { duration: M19_SPIN_MS, easing: STANDARD });
    glowProgress.value = withTiming(0, { duration: M19_SPIN_MS, easing: STANDARD });
    spinDeg.value = withTiming(next * 90, { duration: M19_SPIN_MS, easing: STANDARD }, (finished) => {
      if (finished) runOnJS(finishSpin)();
    });
  };

  const startLoading = () => {
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
      setShowResult(true);
    }, LOADING_MS);
  };

  const goNext = () => {
    if (!selected || !step || !asking || busy.current) return;
    busy.current = true;
    const from = index;
    const word = displayFiee(step.key, selected);
    setCenteredWord(word);
    setPhase('commit');
    animPhase.value = PHASE_COMMIT;
    commitProgress.value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    glowProgress.value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    fills[from].value = withTiming(1, { duration: M19_CENTER_MS, easing: STANDARD });
    outlines[from].value = withTiming(0, { duration: M19_CENTER_MS, easing: STANDARD });

    if (from >= FIEE_DIMENSIONS.length - 1) {
      void persistOnce();
      holdTimer.current = setTimeout(startLoading, M19_CENTER_MS + M19_HOLD_MS);
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

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_fiee',
        title: result || 'FIEE?',
        contextSummary: result,
        internalContext: result,
        initialUserMessage: prompt,
      },
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
    const p = animPhase.value;
    if (p === PHASE_LOAD) {
      return { opacity: 0, transform: [{ translateY: 0 }] };
    }
    if (p === PHASE_COMMIT) {
      return {
        opacity: interpolate(commitProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
        transform: [{ translateY: 0 }],
      };
    }
    if (p === PHASE_SPIN) {
      return {
        opacity: interpolate(enterProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: interpolate(enterProgress.value, [0.5, 1], [PAGE_ENTER, 0], Extrapolation.CLAMP) }],
      };
    }
    return { opacity: 1, transform: [{ translateY: 0 }] };
  });
  const wordStyle = useAnimatedStyle(() => {
    const size = interpolate(commitProgress.value, [0, 1], [34, 26]);
    const spinFade = interpolate(enterProgress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP);
    const selectedFade = interpolate(selectProgress.value, [0, 1], [0, 1]);
    const opacity =
      animPhase.value === PHASE_ASK
        ? selectedFade
        : animPhase.value === PHASE_LOAD
          ? interpolate(loadProgress.value, [0, 1], [1, 0])
          : spinFade;
    return {
      top: slotY.value,
      fontSize: size,
      lineHeight: interpolate(commitProgress.value, [0, 1], [40, 32]),
      color: interpolateColor(commitProgress.value, [0, 1], [colors.text, colors.text2]),
      opacity,
      transform: [{ translateY: interpolate(commitProgress.value, [0, 1], [0, WORD_RISE]) }],
    };
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
      FIEE_DIMENSIONS.map((item) => displayFiee(item.key, answers[item.key]))
        .filter(Boolean)
        .join(', ') || 'Seu check-in';
    return (
      <ActivityResult
        mist={assets.fieeMist}
        giz={assets.fieeGiz}
        insight={insight}
        body={
          result
            ? `${result} contam a história de como você está agora. Guarde o quadro inteiro, não só o que grita mais alto.`
            : 'Você passou pelas quatro dimensões. Guarde o que apareceu.'
        }
        sectionLabel="Seu check-in"
        followUps={ACTIVITY_FOLLOWUPS.fiee}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        {FIEE_DIMENSIONS.map((dimension, i) =>
          answers[dimension.key] ? (
            <ResultEntry
              key={dimension.key}
              label={RESULT_LABELS[i]}
              value={displayFiee(dimension.key, answers[dimension.key])}
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, overflow: 'hidden' }}>
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

      <View style={{ alignItems: 'center', paddingTop: 30 }}>
        <Animated.View style={[{ width: compass, height: compass }, compassScaleStyle]}>
          <Animated.View style={[{ width: compass, height: compass }, spinStyle]}>
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
          <View style={{ paddingTop: 48 }}>
            <ActivityKicker label={step?.title ?? ''} />
            <View style={{ paddingHorizontal: 40, paddingTop: 14 }}>
              <ActivityPrompt>{step?.prompt ?? ''}</ActivityPrompt>
            </View>
          </View>

          <View
            collapsable={false}
            onLayout={(event) => {
              slotY.value = event.nativeEvent.layout.y + 18;
            }}
            style={{ minHeight: 56, paddingTop: 18 }}
          />

          <View
            style={{
              height: 1.5,
              backgroundColor: colors.line,
              marginHorizontal: 60,
            }}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingTop: 28 }}
          >
            {step?.options.map((option) => (
              <FieeChip
                key={option}
                label={displayFiee(step.key, option)}
                selected={selected === option}
                dimmed={Boolean(selected) && selected !== option}
                color={step.color}
                labelColor={CHIP_LABEL}
                onPress={() => {
                  if (!asking) return;
                  setAnswers((current) => ({ ...current, [step.key]: option }));
                }}
              />
            ))}
          </ScrollView>

          <View style={{ flex: 1 }} />

          <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
            <FieeNextButton enabled={Boolean(selected)} onPress={goNext} />
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
  onPress,
}: {
  label: string;
  selected: boolean;
  dimmed: boolean;
  color: string;
  labelColor: string;
  onPress: () => void;
}) {
  const dim = useSharedValue(dimmed ? 1 : 0);
  useEffect(() => {
    dim.value = withTiming(dimmed ? 1 : 0, { duration: M18_MS, easing: QUICK });
  }, [dim, dimmed]);
  const wrap = useAnimatedStyle(() => ({
    opacity: interpolate(dim.value, [0, 1], [1, 0.4]),
  }));
  return (
    <Animated.View style={wrap}>
      <BudChip
        label={label}
        selected={selected}
        selectedColor={color}
        selectedLabelColor={labelColor}
        onPress={onPress}
      />
    </Animated.View>
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
