import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, List } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BudButton, BudIconButton, BudRangePicker, VoicePicker } from '@/components/v3';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/healthSafety';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useUserPlan } from '@/hooks/useUserPlan';
import {
  OnboardingCheckIcon,
  OnboardingClockIcon,
  OnboardingEnvelopeIcon,
  OnboardingMessageIcon,
  OnboardingPlusIcon,
  OnboardingShareIcon,
} from '@/pages/onboardingV3/onboardingIcons';
import { OnboardingHub, OnboardingIndexList, stepIndexForKey } from '@/pages/onboardingV3/OnboardingIndex';
import { PaywallOfferCard } from '@/pages/paywall/PaywallOfferCard';
import {
  displayedOptionsFrom,
  optionsMatch,
  withOnboardingGender,
} from '@/pages/onboardingV3/onboardingGender';
import { onboardingEasing, onboardingMotion } from '@/pages/onboardingV3/onboardingMotion';
import {
  MOOD_STOPS,
  ONBOARDING_V3_STEPS,
  type OnboardingArt,
  type OnboardingTitle,
} from '@/pages/onboardingV3/onboardingSteps';
import { fonts, useV3Asset, useV3Colors, voiceOptions, type V3ThemedAssets } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LOADING_PHRASES = ['Entendendo', 'Aprendendo', 'Preparando'] as const;

function splitList(value: string | undefined) {
  if (!value) return [] as string[];
  return value.split(' · ').filter(Boolean);
}

function joinList(values: string[]) {
  return values.join(' · ');
}

function artSource(art: OnboardingArt | undefined, assets: V3ThemedAssets) {
  if (art === 'lock') return assets.onboardingLock;
  if (art === 'leafSit') return assets.onboardingLeafSit;
  if (art === 'leafWalk') return assets.onboardingLeafWalk;
  if (art === 'mood') return assets.onboardingMood;
  if (art === 'bell') return assets.onboardingBell;
  if (art === 'waves') return assets.onboardingWaves;
  return assets.onboardingLeafStand;
}

function AccentTitle({
  title,
  color,
  accent,
  size = 34,
  lineHeight = 40,
}: {
  title: OnboardingTitle;
  color: string;
  accent: string;
  size?: number;
  lineHeight?: number;
}) {
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight,
        letterSpacing: -0.4,
        color,
      }}
    >
      {title.before}
      <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: accent }}>
        {title.accent}
      </Text>
      {title.after ?? ''}
    </Text>
  );
}

function SelectRow({
  label,
  selected,
  onPress,
  showMark = true,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  showMark?: boolean;
}) {
  const colors = useV3Colors();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: onboardingMotion.optionMs,
      easing: onboardingEasing.quick,
    });
  }, [progress, selected]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, colors.accent]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.text, colors.onAccent]),
  }));
  const plusStyle = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - progress.value) }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: 0.7 * progress.value }));

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        {
          height: 60,
          borderRadius: 20,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: showMark ? 'space-between' : 'center',
        },
        rowStyle,
      ]}
    >
      <Animated.Text
        style={[
          {
            fontFamily: fonts.sansSemi,
            fontSize: 16.5,
            lineHeight: 16.5,
            flex: showMark ? 1 : undefined,
            textAlign: showMark ? 'left' : 'center',
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
      {showMark ? (
        <View style={{ width: 22, height: 22 }}>
          <Animated.View style={[{ position: 'absolute' }, plusStyle]}>
            <OnboardingPlusIcon color={colors.text} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, checkStyle]}>
            <OnboardingCheckIcon color={colors.onAccent} />
          </Animated.View>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

function BudToggle({ value, onValueChange }: { value: boolean; onValueChange: (next: boolean) => void }) {
  const colors = useV3Colors();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        backgroundColor: value ? colors.accent : colors.line,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? colors.onAccent : colors.surface,
          marginLeft: value ? 23 : 3,
        }}
      />
    </Pressable>
  );
}

function MoodArtLayer({
  source,
  size,
  layer,
  progress,
}: {
  source: ImageSourcePropType;
  size: number;
  layer: number;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const dist = Math.abs(progress.value - layer);
    return {
      opacity: interpolate(dist, [0, 1], [1, 0], Extrapolation.CLAMP),
      zIndex: dist < 0.5 ? 1 : 0,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
    </Animated.View>
  );
}

function MoodArtBlock({ progress }: { progress: SharedValue<number> }) {
  const assets = useV3Asset();
  const [size, setSize] = useState(260);
  const sources = [
    assets.onboardingMood,
    assets.onboardingMoodSolto,
    assets.onboardingMoodAltos,
    assets.onboardingMoodLevando,
    assets.onboardingMoodEspiral,
  ];
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * onboardingMotion.moodRotatePerStop}deg` }],
  }));

  return (
    <View
      style={styles.moodArtSlot}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        const next = Math.max(0, Math.min(260, Math.floor(Math.min(width, height))));
        if (next > 0) setSize(next);
      }}
    >
      <Animated.View style={[{ width: size, height: size }, spinStyle]}>
        {sources.map((source, artLayer) => (
          <MoodArtLayer key={artLayer} source={source} size={size} layer={artLayer} progress={progress} />
        ))}
      </Animated.View>
    </View>
  );
}

function LoadingPhrase({ phrase, color, accent }: { phrase: string; color: string; accent: string }) {
  const progress = useSharedValue(1);
  const [incoming, setIncoming] = useState(phrase);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useEffect(() => {
    if (phrase === incoming) return;
    setOutgoing(incoming);
    setIncoming(phrase);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: onboardingMotion.loadingPhraseMs,
      easing: onboardingEasing.gentle,
    });
  }, [incoming, phrase, progress]);

  const incomingStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -8]) }],
  }));

  return (
    <View style={styles.loadingPhraseSlot}>
      {outgoing ? (
        <Animated.Text
          style={[styles.loadingPhrase, { color, position: 'absolute', left: 0, right: 0 }, outgoingStyle]}
        >
          {outgoing}
          <Text style={{ color: accent }}>.</Text>
        </Animated.Text>
      ) : null}
      <Animated.Text style={[styles.loadingPhrase, { color }, incomingStyle]}>
        {incoming}
        <Text style={{ color: accent }}>.</Text>
      </Animated.Text>
    </View>
  );
}

function MoodLabelCrossfade({ label, color }: { label: string; color: string }) {
  const progress = useSharedValue(1);
  const [incoming, setIncoming] = useState(label);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useEffect(() => {
    if (label === incoming) return;
    setOutgoing(incoming);
    setIncoming(label);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: onboardingMotion.moodMs,
      easing: onboardingEasing.gentle,
    });
  }, [incoming, label, progress]);

  const incomingStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const outgoingStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return (
    <View style={{ marginTop: 40, height: 21, alignItems: 'center', justifyContent: 'center' }}>
      {outgoing ? (
        <Animated.Text
          style={[
            {
              position: 'absolute',
              fontFamily: fonts.sansSemi,
              fontSize: 21,
              lineHeight: 21,
              color,
            },
            outgoingStyle,
          ]}
        >
          {outgoing}
        </Animated.Text>
      ) : null}
      <Animated.Text
        style={[
          {
            fontFamily: fonts.sansSemi,
            fontSize: 21,
            lineHeight: 21,
            color,
          },
          incomingStyle,
        ]}
      >
        {incoming}
      </Animated.Text>
    </View>
  );
}

export default function OnboardingV3Screen({ replay = false }: { replay?: boolean } = {}) {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const flow = useOnboardingFlow();
  const { data: profile } = useAppProfileQuery();
  const { completeOnboarding, submitting } = useOnboardingComplete();
  const { can } = useAppAudience();
  const showPaywall = can('paywall');
  const { startCheckout } = useUserPlan();
  const { setNotificationsEnabled } = useNotificationPreferences();
  const [index, setIndex] = useState(0);
  const [hubOpen, setHubOpen] = useState(replay);
  const [fromHub, setFromHub] = useState(false);
  const [sheetMode, setSheetMode] = useState<null | 'skip' | 'index'>(null);
  const [skipDeep, setSkipDeep] = useState(false);
  const [planInterval, setPlanInterval] = useState<'annual' | 'monthly'>('annual');
  const [moodIndex, setMoodIndex] = useState(0);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [loadingTick, setLoadingTick] = useState(0);
  const [loadingMounted, setLoadingMounted] = useState(false);
  const [selectedMany, setSelectedMany] = useState<string[]>([]);
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const loadingMountedRef = useRef(false);
  const hubOpenRef = useRef(hubOpen);
  const fromHubRef = useRef(fromHub);
  const questionRef = useRef<ReactNode>(null);
  indexRef.current = index;
  loadingMountedRef.current = loadingMounted;
  hubOpenRef.current = hubOpen;
  fromHubRef.current = fromHub;
  const stepProgress = useSharedValue(1);
  const stepDir = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const sheetProgress = useSharedValue(0);
  const loadingOpacity = useSharedValue(0);
  const readyReveal = useSharedValue(1);
  const moodProgress = useSharedValue(0);
  const [exitTree, setExitTree] = useState<ReactNode>(null);
  const [flashOption, setFlashOption] = useState<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(360);

  const visibleIndexes = useMemo(
    () =>
      ONBOARDING_V3_STEPS.map((_, stepIndex) => stepIndex).filter((stepIndex) => {
        if (skipDeep && ONBOARDING_V3_STEPS[stepIndex].group === 'deep') return false;
        if (ONBOARDING_V3_STEPS[stepIndex].layout === 'paywall' && (replay || !showPaywall)) {
          return false;
        }
        return true;
      }),
    [replay, showPaywall, skipDeep],
  );

  const genderValue = flow.answers.gender || profile?.gender || '';
  const step = useMemo(
    () => withOnboardingGender(ONBOARDING_V3_STEPS[index], genderValue),
    [genderValue, index],
  );
  const visiblePos = Math.max(0, visibleIndexes.indexOf(index));

  const currentValue = useMemo(() => {
    if (!step.field) return '';
    if (step.field === 'displayName') return flow.displayName;
    if (step.field === 'ageRange') return flow.ageRange ?? '30 a 34';
    return flow.answers[step.field] ?? '';
  }, [flow.answers, flow.ageRange, flow.displayName, step.field]);

  useEffect(() => {
    if (step.layout === 'multiSelect') {
      setSelectedMany(displayedOptionsFrom(splitList(currentValue), step.options));
    }
    if (step.layout === 'mood') {
      const found = MOOD_STOPS.findIndex((item) => item.label === currentValue);
      setMoodIndex(found >= 0 ? found : 0);
    }
    if (step.layout === 'voice') {
      const found = voiceOptions.findIndex((item) => item.id === currentValue);
      setVoiceIndex(found >= 0 ? found : 0);
    }
    if (step.layout === 'ageWheel' && !flow.ageRange) {
      flow.setAgeRange('30 a 34');
    }
  }, [currentValue, flow.ageRange, flow.setAgeRange, step.key, step.layout, step.options]);

  const setValue = (value: string) => {
    if (step.field === 'displayName') {
      flow.setDisplayName(value);
      return;
    }
    if (step.field === 'ageRange') {
      flow.setAgeRange(value as typeof flow.ageRange);
      return;
    }
    if (step.field) {
      flow.setAnswer(step.field, value);
    }
  };

  const persistStep = () => {
    if (step.layout === 'multiSelect' && step.field) {
      flow.setAnswer(step.field, joinList(selectedMany));
    }
    if (step.layout === 'mood') {
      flow.setAnswer('mood', MOOD_STOPS[moodIndex].label);
    }
    if (step.layout === 'voice') {
      flow.setAnswer('voice', voiceOptions[voiceIndex].id);
    }
    if (step.layout === 'ageWheel' && !flow.ageRange) {
      flow.setAgeRange('30 a 34');
    }
  };

  const clearExitLayer = useCallback(() => {
    animatingRef.current = false;
    setExitTree(null);
  }, []);

  const commitLoadingIndex = useCallback((nextIndex: number) => {
    setIndex(nextIndex);
    animatingRef.current = false;
  }, []);

  const finishLoadingOverlay = useCallback(() => {
    setLoadingMounted(false);
    animatingRef.current = false;
  }, []);

  const animateToIndex = (nextIndex: number, direction: 1 | -1) => {
    if (animatingRef.current || nextIndex === index) return;
    persistStep();
    const nextLayout = ONBOARDING_V3_STEPS[nextIndex]?.layout;
    if (nextLayout === 'loading') {
      animatingRef.current = true;
      setLoadingTick(0);
      setLoadingMounted(true);
      loadingOpacity.value = 0;
      loadingOpacity.value = withTiming(
        1,
        { duration: onboardingMotion.loadingEnterMs, easing: onboardingEasing.gentle },
        (finished) => {
          if (finished) runOnJS(commitLoadingIndex)(nextIndex);
        },
      );
      return;
    }
    if (step.layout === 'loading' && nextLayout === 'ready') {
      animatingRef.current = true;
      readyReveal.value = 0;
      setIndex(nextIndex);
      readyReveal.value = withTiming(1, {
        duration: onboardingMotion.loadingRevealMs,
        easing: onboardingEasing.gentle,
      });
      loadingOpacity.value = withTiming(
        0,
        { duration: onboardingMotion.loadingRevealMs, easing: onboardingEasing.gentle },
        (finished) => {
          if (finished) runOnJS(finishLoadingOverlay)();
        },
      );
      return;
    }
    animatingRef.current = true;
    stepDir.value = direction;
    stepProgress.value = 0;
    setExitTree(questionRef.current);
    setIndex(nextIndex);
  };

  useLayoutEffect(() => {
    if (!exitTree) return;
    const duration = stepDir.value > 0 ? onboardingMotion.nextMs : onboardingMotion.backMs;
    stepProgress.value = withTiming(1, { duration, easing: onboardingEasing.standard }, (finished) => {
      if (finished) runOnJS(clearExitLayer)();
    });
  }, [clearExitLayer, exitTree, stepDir, stepProgress]);

  const goToVisible = (from: number, direction: 1 | -1) => {
    const pos = visibleIndexes.indexOf(from);
    const nextPos = pos + direction;
    if (nextPos < 0 || nextPos >= visibleIndexes.length) return;
    animateToIndex(visibleIndexes[nextPos], direction);
  };

  const finishOnboarding = async () => {
    persistStep();
    if (!flow.conversationGoal && flow.answers.focus) {
      flow.setConversationGoal(flow.answers.focus);
    }
    if (!flow.initialThoughts && (flow.answers.mood || flow.answers.anythingElse)) {
      flow.setInitialThoughts(flow.answers.anythingElse || flow.answers.mood);
    }
    const { error } = await completeOnboarding({ replay });
    if (replay && !error) {
      navigation.goBack();
    }
  };

  const exitReplay = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const goNext = async () => {
    persistStep();
    if (fromHubRef.current) {
      setFromHub(false);
      setHubOpen(true);
      return;
    }
    if (step.layout === 'paywall') {
      await startCheckout(planInterval);
      await finishOnboarding();
      return;
    }
    if (index === visibleIndexes[visibleIndexes.length - 1]) {
      await finishOnboarding();
      return;
    }
    goToVisible(index, 1);
  };

  const skipAprofundar = () => {
    if (animatingRef.current) return;
    const quase = ONBOARDING_V3_STEPS.findIndex((item) => item.key === 'quase');
    setSkipDeep(true);
    animateToIndex(quase, 1);
  };

  const fadeThenFinish = () => {
    screenOpacity.value = withTiming(
      0,
      {
        duration: onboardingMotion.fadeExitMs,
        easing: onboardingEasing.standard,
      },
      (finished) => {
        if (finished) runOnJS(finishOnboarding)();
      },
    );
  };

  const openSheet = (mode: 'skip' | 'index') => {
    setSheetMode(mode);
    sheetProgress.value = withTiming(1, {
      duration: onboardingMotion.sheetMs,
      easing: onboardingEasing.standard,
    });
  };

  const closeSheet = (after?: () => void) => {
    sheetProgress.value = withTiming(
      0,
      {
        duration: onboardingMotion.sheetMs,
        easing: onboardingEasing.standard,
      },
      (finished) => {
        if (!finished) return;
        runOnJS(setSheetMode)(null);
        if (after) runOnJS(after)();
      },
    );
  };

  const jumpToStepKey = (stepKey: string, viaHub: boolean) => {
    const nextIndex = stepIndexForKey(stepKey);
    if (nextIndex < 0 || animatingRef.current) return;
    const next = ONBOARDING_V3_STEPS[nextIndex];
    if (next.group === 'deep') setSkipDeep(false);
    persistStep();
    setFromHub(viaHub);
    setHubOpen(false);
    if (nextIndex === index) return;
    animateToIndex(nextIndex, nextIndex > index ? 1 : -1);
  };

  const returnToHub = () => {
    persistStep();
    setFromHub(false);
    setHubOpen(true);
  };

  const startLinearReplay = () => {
    setFromHub(false);
    setSkipDeep(false);
    setHubOpen(false);
    if (index === 0) return;
    animateToIndex(0, 1);
  };

  useEffect(() => {
    if (step.layout !== 'loading') return;
    setLoadingTick(0);
    const timers = [
      setTimeout(() => setLoadingTick(1), 900),
      setTimeout(() => setLoadingTick(2), 1800),
      setTimeout(() => goToVisible(indexRef.current, 1), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step.key, step.layout]);

  const toggleMany = (option: string) => {
    setSelectedMany((current) => {
      if (current.some((item) => optionsMatch(item, option))) {
        return current.filter((item) => !optionsMatch(item, option));
      }
      if (step.maxSelect && current.length >= step.maxSelect) {
        return current;
      }
      return [...current, option];
    });
  };

  const handleCta = async () => {
    if (step.layout === 'notify') {
      try {
        await setNotificationsEnabled(true);
      } catch {
        // permission denied still continues
      }
      flow.setAnswer('notifications', 'Sim');
    }
    if (step.layout === 'microphone') {
      try {
        await Audio.requestPermissionsAsync();
      } catch {
        // ignore
      }
      flow.setAnswer('microphone', 'Sim');
    }
    await goNext();
  };

  const outgoingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(stepProgress.value, [0, 1], [0, -windowWidth * stepDir.value]),
      },
    ],
  }));
  const incomingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(stepProgress.value, [0, 1], [windowWidth * stepDir.value, 0]),
      },
    ],
  }));
  const screenFadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value * interpolate(readyReveal.value, [0, 1], [0.88, 1]),
    transform: [{ translateY: interpolate(readyReveal.value, [0, 1], [16, 0]) }],
  }));
  const loadingOverlayStyle = useAnimatedStyle(() => ({ opacity: loadingOpacity.value }));
  const loadingMistStyle = useAnimatedStyle(() => ({
    opacity: interpolate(loadingOpacity.value, [0, 0.35, 1], [0, 0.7, 0.7]),
  }));
  const loadingArtStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(loadingOpacity.value, [0, 1], [0.94, 1]) }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetProgress.value, [0, 1], [0, onboardingMotion.scrim]),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(sheetProgress.value, [0, 1], [sheetHeight, 0]),
      },
    ],
  }));
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetMode) {
        closeSheet();
        return true;
      }
      if (hubOpenRef.current) {
        if (replay) exitReplay();
        return true;
      }
      const layout = ONBOARDING_V3_STEPS[indexRef.current]?.layout;
      if (layout === 'loading' || layout === 'ready' || loadingMountedRef.current) {
        return true;
      }
      if (fromHubRef.current) {
        returnToHub();
        return true;
      }
      const pos = visibleIndexes.indexOf(indexRef.current);
      if (pos > 0) {
        goToVisible(indexRef.current, -1);
        return true;
      }
      if (replay) {
        setHubOpen(true);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [replay, sheetMode, visibleIndexes]);

  const showBack = (replay || visiblePos > 0) && step.layout !== 'loading' && step.layout !== 'ready';
  const showMap =
    !hubOpen && step.layout !== 'loading' && step.layout !== 'ready' && step.layout !== 'paywall';
  const showSkip = Boolean(step.skippable) && step.layout !== 'ready' && step.layout !== 'paywall';
  const ctaDisabled =
    (step.layout === 'multiSelect' && selectedMany.length === 0) ||
    (step.layout === 'text' && !currentValue.trim());

  const misted = step.layout === 'mistHero' || step.layout === 'deepen';
  const mistOpacity = step.layout === 'deepen' ? 0.4 : 0.55;

  const renderBody = () => {
    if (step.layout === 'commitment') {
      return (
        <>
          <View style={styles.flexCenter}>
            <Image source={artSource(step.art, assets)} style={styles.lock} resizeMode="contain" />
          </View>
          <Pressable
            onPress={() => flow.setShareConversations(!flow.shareConversations)}
            style={[styles.toggleCard, { backgroundColor: colors.surface }]}
          >
            <BudToggle value={flow.shareConversations} onValueChange={flow.setShareConversations} />
            <Text style={[styles.toggleCopy, { color: colors.text }]}>
              Ajudar a melhorar o Bud compartilhando minhas conversas de forma anônima.
            </Text>
          </Pressable>
        </>
      );
    }

    if (step.layout === 'mistHero') {
      const sit = step.art === 'leafSit';
      return (
        <View style={styles.flex}>
          <Image
            source={artSource(step.art, assets)}
            style={sit ? styles.leafSit : styles.leafStand}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (step.layout === 'ready') {
      return (
        <View style={styles.flexCenter}>
          <Image source={artSource(step.art, assets)} style={styles.leafWalk} resizeMode="contain" />
        </View>
      );
    }

    if (step.layout === 'deepen') {
      const deepenListWidth = Math.min(
        262,
        windowWidth - 28 - 170 - 20 + 40,
      );
      return (
        <View style={styles.flex}>
          <View style={[styles.timeChip, { backgroundColor: colors.surface2 }]}>
            <OnboardingClockIcon color={colors.accent} />
            <Text style={[styles.timeChipText, { color: colors.text }]}>Cerca de 4 minutos</Text>
          </View>
          <View style={[styles.benefitList, { width: deepenListWidth }]}>
            {[
              { Icon: OnboardingMessageIcon, text: 'Conversas mais certeiras desde o primeiro dia' },
              { Icon: OnboardingEnvelopeIcon, text: 'Cartas do dia com a sua cara' },
              { Icon: OnboardingShareIcon, text: 'Dá para mudar tudo depois em Preferências' },
            ].map((item) => (
              <View key={item.text} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <item.Icon color={colors.accent} />
                </View>
                <Text style={[styles.benefitText, { color: colors.text }]}>{item.text}</Text>
              </View>
            ))}
          </View>
          <Image source={artSource(step.art, assets)} style={styles.leafSit} resizeMode="contain" />
        </View>
      );
    }

    if (step.layout === 'text') {
      return (
        <View style={styles.nameBlock}>
          <TextInput
            value={currentValue}
            onChangeText={setValue}
            placeholder={step.placeholder}
            placeholderTextColor={colors.text3}
            autoFocus
            style={[styles.nameInput, { color: colors.text }]}
          />
          <View style={[styles.nameUnderline, { backgroundColor: colors.accent }]} />
        </View>
      );
    }

    if (step.layout === 'anythingElse') {
      return (
        <View style={styles.anythingBlock}>
          <TextInput
            value={currentValue}
            onChangeText={setValue}
            placeholder={step.placeholder}
            placeholderTextColor={colors.text3}
            multiline
            style={[styles.anythingInput, { color: colors.text }]}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptRow}
            contentContainerStyle={styles.promptContent}
          >
            {(step.prompts ?? []).map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => setValue(currentValue ? `${currentValue} ${prompt}` : prompt)}
                style={[styles.promptChip, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[styles.promptChipText, { color: colors.text }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (step.layout === 'ageWheel') {
      const selected = currentValue;
      const selectedIndex = Math.max(0, (step.options ?? []).indexOf(selected));
      return (
        <ScrollView style={styles.ageList} contentContainerStyle={styles.ageContent} showsVerticalScrollIndicator={false}>
          {(step.options ?? []).map((option, optionIndex) => {
            const isSelected = option === selected;
            const faded = Math.abs(optionIndex - selectedIndex) >= 3;
            return (
              <Pressable
                key={option}
                onPress={() => setValue(option)}
                style={[
                  styles.ageRow,
                  isSelected ? { backgroundColor: colors.surface } : null,
                  faded ? { opacity: 0.5 } : null,
                ]}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: isSelected ? 22 : 18,
                    lineHeight: isSelected ? 22 : 18,
                    color: isSelected ? colors.text : colors.text3,
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      );
    }

    if (step.layout === 'choiceAdvance') {
      return (
        <ScrollView
          style={styles.choiceList}
          contentContainerStyle={styles.choiceContent}
          showsVerticalScrollIndicator={false}
        >
          {(step.options ?? []).map((option) => (
            <SelectRow
              key={option}
              label={option}
              selected={
                flashOption ? flashOption === option : optionsMatch(option, currentValue)
              }
              showMark={false}
              onPress={() => {
                if (animatingRef.current) return;
                setValue(option);
                setFlashOption(option);
                setTimeout(() => {
                  setFlashOption(null);
                  if (fromHubRef.current) {
                    setFromHub(false);
                    setHubOpen(true);
                    return;
                  }
                  goToVisible(index, 1);
                }, onboardingMotion.optionMs);
              }}
            />
          ))}
        </ScrollView>
      );
    }

    if (step.layout === 'multiSelect') {
      return (
        <ScrollView
          style={styles.choiceListTight}
          contentContainerStyle={styles.choiceContent}
          showsVerticalScrollIndicator={false}
        >
          {(step.options ?? []).map((option) => (
            <SelectRow
              key={option}
              label={option}
              selected={selectedMany.some((item) => optionsMatch(item, option))}
              onPress={() => toggleMany(option)}
            />
          ))}
        </ScrollView>
      );
    }

    if (step.layout === 'mood') {
      const stop = MOOD_STOPS[moodIndex];
      return (
        <View style={styles.moodBody}>
          <MoodArtBlock progress={moodProgress} />
          <MoodLabelCrossfade label={stop.label} color={colors.text} />
          <BudRangePicker
            index={moodIndex}
            progress={moodProgress}
            onIndexChange={setMoodIndex}
            style={styles.moodPicker}
          />
        </View>
      );
    }

    if (step.layout === 'voice') {
      return (
        <View style={styles.flex}>
          <View style={styles.voicePicker}>
            <VoicePicker index={voiceIndex} onIndexChange={setVoiceIndex} showSilentHint />
          </View>
        </View>
      );
    }

    if (step.layout === 'notify' || step.layout === 'microphone') {
      return (
        <View
          style={[
            styles.artCard,
            {
              backgroundColor: colors.surface,
              height: step.layout === 'notify' ? 360 : 340,
              marginTop: step.layout === 'notify' ? 62 : 48,
            },
          ]}
        >
          {step.layout === 'notify' ? (
            <View style={styles.bellWindow}>
              <Image source={artSource(step.art, assets)} style={styles.bellArt} />
            </View>
          ) : (
            <Image source={artSource(step.art, assets)} style={styles.waveArt} resizeMode="contain" />
          )}
        </View>
      );
    }

    if (step.layout === 'paywall') {
      return (
        <View style={styles.paywallCardWrap}>
          <PaywallOfferCard interval={planInterval} onChangeInterval={setPlanInterval} />
        </View>
      );
    }

    return <View style={styles.flex} />;
  };

  const questionNode =
    step.layout === 'loading' ? (
      <View style={styles.flex} />
    ) : (
    <>
      <View
        style={[
          styles.titleBlock,
          step.layout === 'paywall' ? { marginTop: 12, paddingHorizontal: 24 } : null,
          step.layout === 'ready' ? { marginTop: 12 } : null,
          step.layout === 'deepen' ? { marginTop: 26 } : null,
        ]}
      >
        <AccentTitle title={step.title} color={colors.text} accent={colors.accent} />
        {step.subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: colors.text2 },
              step.layout === 'paywall' ? styles.paywallSubtitle : null,
            ]}
          >
            {step.subtitle}
          </Text>
        ) : null}
      </View>
      {renderBody()}
    </>
    );
  questionRef.current = questionNode;

  if (hubOpen) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <OnboardingHub
          flow={flow}
          saving={submitting}
          onBack={exitReplay}
          onSelect={(stepKey) => jumpToStepKey(stepKey, true)}
          onSave={() => void finishOnboarding()}
          onReplayAll={startLinearReplay}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[{ flex: 1 }, screenFadeStyle]}>
      {misted ? (
        <Image source={assets.onboardingMist} style={[styles.mist, { opacity: mistOpacity }]} resizeMode="cover" />
      ) : null}

      <View style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
        {step.layout === 'ready' ? (
          <View style={styles.readyHeader} />
        ) : (
          <View style={styles.header}>
            {showBack ? (
              <BudIconButton
                icon={ChevronLeft}
                accessibilityLabel="Voltar"
                onPress={() => {
                  if (fromHub) {
                    returnToHub();
                    return;
                  }
                  if (visiblePos <= 0) {
                    if (replay) {
                      setHubOpen(true);
                      return;
                    }
                    return;
                  }
                  goToVisible(index, -1);
                }}
              />
            ) : (
              <View style={styles.headerSpacer} />
            )}
            {showMap ? (
              <BudIconButton
                icon={List}
                accessibilityLabel="Ir para uma pergunta"
                onPress={() => {
                  if (replay) {
                    returnToHub();
                    return;
                  }
                  openSheet('index');
                }}
              />
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        )}

        <View style={styles.questionStage}>
          {exitTree ? (
            <>
              <Animated.View style={[styles.questionLayerExit, outgoingStyle]} pointerEvents="none">
                {exitTree}
              </Animated.View>
              <Animated.View style={[styles.questionLayerExit, incomingStyle]}>{questionNode}</Animated.View>
            </>
          ) : (
            <View style={styles.questionLayer}>{questionNode}</View>
          )}
        </View>

        <View style={styles.footer}>
          {step.layout === 'paywall' ? (
            <Text style={[styles.renew, { color: colors.text2 }]}>
              Renova em{' '}
              <Text style={{ fontFamily: fonts.sansSemi, color: colors.text }}>
                {planInterval === 'annual' ? 'R$ 999,90 por ano' : 'R$ 129,90 por mês'}
              </Text>
              {' · cancele quando quiser'}
            </Text>
          ) : null}

          {step.cta ? (
            <BudButton
              label={step.cta}
              disabled={ctaDisabled || Boolean(exitTree) || loadingMounted}
              loading={submitting}
              onPress={() => {
                void handleCta();
              }}
            />
          ) : null}

          {step.layout === 'paywall' ? (
            <>
              <Pressable
                onPress={() => void finishOnboarding()}
                style={styles.paywallSkipHit}
                accessibilityRole="button"
              >
                <Text style={[styles.skipText, { color: colors.text }]}>Agora não</Text>
              </Pressable>
              <Text style={[styles.legal, { color: colors.text3 }]}>
                Restaurar compra ·{' '}
                <Text onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}>Termos</Text>
                {' · '}
                <Text onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>Privacidade</Text>
              </Text>
            </>
          ) : null}

          {showSkip ? (
            <Pressable
              onPress={() => {
                if (fromHub) {
                  returnToHub();
                  return;
                }
                if (step.key === 'deepen') {
                  skipAprofundar();
                  return;
                }
                openSheet('skip');
              }}
              style={styles.skipHit}
              accessibilityRole="button"
            >
              <Text style={[styles.skipText, { color: colors.text2 }]}>
                {fromHub ? 'Voltar às perguntas' : 'Pular por agora'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      </Animated.View>

      {loadingMounted ? (
        <View style={styles.loadingOverlay}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, loadingOverlayStyle]}
          />
          <Animated.Image
            source={assets.onboardingMist}
            style={[styles.mist, loadingMistStyle]}
            resizeMode="cover"
          />
          <Animated.View style={[styles.loadingBody, loadingOverlayStyle]} pointerEvents="none">
            <Animated.Image
              source={assets.onboardingLoading}
              style={[styles.loadingArt, loadingArtStyle]}
              resizeMode="contain"
            />
            <LoadingPhrase phrase={LOADING_PHRASES[loadingTick]} color={colors.text} accent={colors.accent} />
          </Animated.View>
          <Pressable style={StyleSheet.absoluteFill} accessible={false} />
        </View>
      ) : null}

      <Modal visible={Boolean(sheetMode)} transparent animationType="none" onRequestClose={() => closeSheet()}>
        <View style={styles.modalRoot}>
          <AnimatedPressable
            style={[styles.scrimFill, { backgroundColor: colors.scrim }, scrimStyle]}
            onPress={() => closeSheet()}
          />
          <Animated.View
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) },
              sheetStyle,
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.line }]} />
            </View>
            {sheetMode === 'index' ? (
              <>
                <View style={styles.sheetTitle}>
                  <AccentTitle
                    title={{ before: 'Para onde você quer ', accent: 'ir', after: '?' }}
                    color={colors.text}
                    accent={colors.accent}
                    size={26}
                    lineHeight={32}
                  />
                </View>
                <Text style={[styles.sheetCopy, { color: colors.text2 }]}>
                  Toque para pular até uma pergunta. O que você já escolheu continua marcado.
                </Text>
                <ScrollView
                  style={{ maxHeight: windowHeight * 0.55, marginTop: 8 }}
                  showsVerticalScrollIndicator={false}
                >
                  <OnboardingIndexList
                    flow={flow}
                    onSelect={(stepKey) => {
                      closeSheet(() => jumpToStepKey(stepKey, false));
                    }}
                  />
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.sheetTitle}>
                  <AccentTitle
                    title={{ before: 'Tudo bem ', accent: 'pular' }}
                    color={colors.text}
                    accent={colors.accent}
                    size={26}
                    lineHeight={32}
                  />
                </View>
                <Text style={[styles.sheetCopy, { color: colors.text2 }]}>
                  Não tem problema. Você pode responder quando quiser em Preferências, e o Bud vai se adaptando
                  enquanto vocês conversam.
                </Text>
                <BudButton label="Continuar respondendo" onPress={() => closeSheet()} style={{ marginTop: 28 }} />
                <Pressable
                  onPress={() => {
                    closeSheet(() => {
                      if (replay) {
                        returnToHub();
                        return;
                      }
                      fadeThenFinish();
                    });
                  }}
                  style={styles.sheetSkipHit}
                  accessibilityRole="button"
                >
                  <Text style={[styles.skipText, { color: colors.text2 }]}>
                    {replay ? 'Voltar às perguntas' : 'Pular e ir para o início'}
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  mist: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: 48, height: 48 },
  readyHeader: { height: 20 },
  questionStage: { flex: 1, overflow: 'hidden' },
  questionLayer: { flex: 1 },
  questionLayerExit: { ...StyleSheet.absoluteFillObject },
  titleBlock: {
    paddingHorizontal: 28,
    marginTop: 36,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 16,
  },
  paywallSubtitle: {
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },
  flex: { flex: 1 },
  flexCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lock: { width: 140, height: 190 },
  leafStand: {
    width: 290,
    height: 390,
    position: 'absolute',
    right: 20,
    bottom: 0,
  },
  leafSit: {
    width: 170,
    height: 230,
    position: 'absolute',
    right: 20,
    bottom: 0,
  },
  leafWalk: { width: 300, height: 400 },
  toggleCard: {
    marginHorizontal: 24,
    marginBottom: 26,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  toggleCopy: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  timeChip: {
    marginTop: 32,
    marginLeft: 28,
    alignSelf: 'flex-start',
    height: 44,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeChipText: { fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 15 },
  benefitList: { marginLeft: 28, marginTop: 10, zIndex: 1 },
  benefitRow: { flexDirection: 'row', gap: 14, paddingTop: 14, alignItems: 'flex-start' },
  benefitIcon: { width: 22, height: 22, marginTop: 1, flexShrink: 0 },
  benefitText: { flex: 1, flexShrink: 1, fontFamily: fonts.sans, fontSize: 16, lineHeight: 25 },
  nameBlock: { marginTop: 78, paddingHorizontal: 28, flex: 1 },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    paddingVertical: 8,
  },
  nameUnderline: { height: 2, marginTop: 6 },
  anythingBlock: { flex: 1, paddingHorizontal: 28 },
  anythingInput: {
    marginTop: 70,
    fontFamily: fonts.sans,
    fontSize: 18,
    lineHeight: 18,
    paddingVertical: 4,
  },
  promptRow: { marginTop: 122, marginHorizontal: -4 },
  promptContent: { gap: 8, paddingRight: 28 },
  promptChip: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  promptChipText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 15 },
  ageList: { marginTop: 108, paddingHorizontal: 24, flex: 1 },
  ageContent: { gap: 2, paddingBottom: 12 },
  ageRow: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceList: { marginTop: 88, paddingHorizontal: 24, flex: 1 },
  choiceListTight: { marginTop: 28, paddingHorizontal: 24, flex: 1 },
  choiceContent: { gap: 10, paddingBottom: 12 },
  moodBody: {
    flex: 1,
    alignItems: 'center',
    minHeight: 0,
    width: '100%',
    paddingTop: 68,
    paddingBottom: 12,
  },
  moodArtSlot: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPicker: {
    marginTop: 13,
  },
  voicePicker: { marginTop: 88 },
  artCard: {
    marginTop: 48,
    marginHorizontal: 24,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellWindow: {
    width: 220,
    height: 260,
    overflow: 'hidden',
  },
  bellArt: {
    position: 'absolute',
    width: 420,
    height: 420,
    left: -117,
    top: -65,
  },
  waveArt: { width: 280, height: 110 },
  paywallCardWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  renew: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
  skipHit: { alignItems: 'center', paddingTop: 42, paddingBottom: 8 },
  skipText: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 16 },
  paywallSkipHit: { alignItems: 'center', paddingTop: 26 },
  legal: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 13, textAlign: 'center', marginTop: 23 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingArt: { width: 220, height: 220 },
  loadingPhraseSlot: {
    marginTop: 120,
    height: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPhrase: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrimFill: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  handleWrap: { alignItems: 'center' },
  handle: { width: 44, height: 5, borderRadius: 3 },
  sheetTitle: { marginTop: 26 },
  sheetCopy: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 25, marginTop: 12 },
  sheetSkipHit: { alignItems: 'center', paddingTop: 22, paddingBottom: 8 },
});
