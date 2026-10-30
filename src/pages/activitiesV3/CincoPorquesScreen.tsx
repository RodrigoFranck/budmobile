import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
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
  ActivityPrompt,
  ActivityResult,
  LayerGlow,
  PreviousAnswerCard,
  ResultEntry,
} from '@/pages/activitiesV3/activityChrome';
import { activityEasing } from '@/pages/activitiesV3/activityMotion';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import { activityColors, fonts, motion, useV3Asset, useV3Colors } from '@/theme';
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
const LOADING_MS = 2200;
const ORB_SIZE = 140;
const ORB_SPIN_MS = 4800;
const ORB_PULSE_MS = 1600;

function CincoPorquesLoadingOrb({ source }: { source: ImageSourcePropType }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: ORB_SPIN_MS, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: ORB_PULSE_MS, easing: activityEasing.gentle }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(pulse);
    };
  }, [pulse, spin]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value}deg` },
      { scale: interpolate(pulse.value, [0, 1], [1, 1.06]) },
    ],
  }));

  return (
    <Reanimated.Image
      source={source}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: ORB_SIZE, height: ORB_SIZE }, style]}
      resizeMode="cover"
    />
  );
}

export default function CincoPorquesScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const [index, setIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const saveActivity = useRef(createActivityPersister()).current;
  const intro = ACTIVITY_INTROS.cinco_porques;
  const step = index >= 0 && index < CINCO_PORQUES.length ? CINCO_PORQUES[index] : null;
  const done = index >= CINCO_PORQUES.length;
  const loading = done && !showResult;
  const glowCount = Math.min((loading ? CINCO_PORQUES.length : answers.length) + 1, LAYER_GLOW_TOPS.length);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: motion.questionStepMs,
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  useEffect(() => {
    if (!done) {
      setShowResult(false);
      return;
    }
    const timer = setTimeout(() => setShowResult(true), LOADING_MS);
    return () => clearTimeout(timer);
  }, [done]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || !step) return;
    const next = [...answers, trimmed];
    setAnswers(next);
    setDraft('');
    setIndex((current) => current + 1);
    if (next.length >= CINCO_PORQUES.length && user?.id) {
      void saveActivity({
        userId: user.id,
        activityId: 'cinco_porques',
        answers: Object.fromEntries(next.map((value, i) => [`p${i + 1}`, value])),
        resultText: next.join(' · '),
      });
    }
  };

  const goToPrevious = () => {
    if (index <= 0) return;
    const previous = answers[answers.length - 1] ?? '';
    setAnswers((current) => current.slice(0, -1));
    setDraft(previous);
    setIndex((current) => current - 1);
  };

  const first = answers[0] ?? '';
  const last = answers[answers.length - 1] ?? '';
  const resultText = answers.join(' · ');

  const persistOnce = async () => {
    if (!user?.id) return;
    await saveActivity({
      userId: user.id,
      activityId: 'cinco_porques',
      answers: Object.fromEntries(answers.map((value, i) => [`p${i + 1}`, value])),
      resultText,
    });
  };

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_cinco_porques',
        title: last || 'Cinco Porquês',
        contextSummary: resultText,
        internalContext: resultText,
        initialUserMessage: prompt,
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
        onStart={() => setIndex(0)}
      />
    );
  }

  if (done && showResult) {
    return (
      <ActivityResult
        mist={assets.mistPorques}
        giz={assets.cincoPorquesGiz}
        insight={last || 'Você chegou mais fundo do que a primeira resposta'}
        body={
          first && last
            ? `Você saiu de "${first}" e chegou em "${last}". Guarde isso — não precisa resolver agora.`
            : 'Você chegou até o fim. Isso já é um movimento.'
        }
        sectionLabel="Seus cinco porquês"
        followUps={ACTIVITY_FOLLOWUPS.cinco_porques}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        {CINCO_PORQUES.map((item, i) =>
          answers[i] ? (
            <ResultEntry
              key={item.key}
              label={i === 0 ? 'Pensamento inicial' : item.title}
              value={answers[i]}
              colors={colors}
            />
          ) : null,
        )}
      </ActivityResult>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg, overflow: 'hidden' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            {CINCO_PORQUES.map((item, i) =>
              answers[i] ? (
                <PreviousAnswerCard key={item.key} question={item.title} answer={answers[i]} compact />
              ) : null,
            )}
          </ScrollView>
          <View
            style={{
              alignItems: 'center',
              paddingBottom: Math.max(insets.bottom, 24),
            }}
          >
            <CincoPorquesLoadingOrb source={assets.cincoPorquesLoadingOrb} />
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
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
            >
              {answers.length ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
                  {answers.map((answer, i) => (
                    <PreviousAnswerCard
                      key={`${CINCO_PORQUES[i].key}-prev`}
                      question={CINCO_PORQUES[i].title}
                      answer={answer}
                    />
                  ))}
                </View>
              ) : null}
              <View style={{ paddingTop: answers.length ? 40 : 32 }}>
                <ActivityKicker label={step?.kicker ?? ''} />
                <View style={{ paddingHorizontal: 36, paddingTop: 28 }}>
                  <ActivityPrompt>{step?.title ?? ''}</ActivityPrompt>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
          <ActivityComposer
            value={draft}
            onChangeText={setDraft}
            onSend={submit}
            placeholder={step?.placeholder}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}
