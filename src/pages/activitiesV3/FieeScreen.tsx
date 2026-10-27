import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, Text, View, type ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton, BudChip } from '@/components/v3';
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
  Glow,
  ResultEntry,
} from '@/pages/activitiesV3/activityChrome';
import { persistActivity } from '@/pages/activitiesV3/persistActivity';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

const LEAF = 128;
const COMPASS = 256;

export default function FieeScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const saved = useRef(false);
  const intro = ACTIVITY_INTROS.fiee;
  const step = index >= 0 && index < FIEE_DIMENSIONS.length ? FIEE_DIMENSIONS[index] : null;
  const done = index >= FIEE_DIMENSIONS.length;
  const selected = step ? answers[step.key] : undefined;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: Math.max(0, index),
      duration: motion.sproutSpinMs,
      useNativeDriver: true,
    }).start();
  }, [index, spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0deg', '90deg', '180deg', '270deg'],
  });

  const result = FIEE_DIMENSIONS.map((dimension) => answers[dimension.key])
    .filter(Boolean)
    .join(' · ');

  const persistOnce = async () => {
    if (saved.current || !user?.id) return;
    saved.current = true;
    await persistActivity({
      userId: user.id,
      activityId: 'fiee',
      answers,
      resultText: result,
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

  if (done) {
    const [fisico, intelectual, emocional] = FIEE_DIMENSIONS.map((item) => answers[item.key]);
    return (
      <ActivityResult
        mist={assets.fieeMist}
        giz={assets.fieeGiz}
        insight={[fisico, intelectual, emocional].filter(Boolean).join(', ') || 'Seu check-in'}
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
        {FIEE_DIMENSIONS.map((dimension) =>
          answers[dimension.key] ? (
            <ResultEntry
              key={dimension.key}
              label={dimension.key === 'fisico' ? 'Fisicamente' : dimension.key === 'intelectual' ? 'Na cabeça' : dimension.key === 'emocional' ? 'Por dentro' : 'Com as pessoas'}
              value={answers[dimension.key]}
              colors={colors}
            />
          ) : null,
        )}
      </ActivityResult>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow
        color={step?.color ?? colors.accent}
        style={{
          width: 840,
          height: 840,
          borderRadius: 420,
          opacity: 0.22,
          left: -200,
          bottom: -280,
          top: undefined,
        }}
      />
      <ActivityFlowHeader title="FIEE?" onClose={() => navigation.goBack()} />

      <View style={{ alignItems: 'center', paddingTop: 24 }}>
        <View style={{ width: COMPASS, height: COMPASS }}>
          <Animated.View
            style={{
              width: COMPASS,
              height: COMPASS,
              transform: [{ rotate: rotation }],
            }}
          >
            <CompassLeaf source={assets.fieeCompassLeaf} left={64} top={128} rotate="0deg" />
            <CompassLeaf source={assets.fieeCompassLeaf} left={128} top={64} rotate="-90deg" dim />
            <CompassLeaf source={assets.fieeCompassLeaf} left={64} top={0} rotate="180deg" dim />
            <CompassLeaf source={assets.fieeCompassLeaf} left={0} top={64} rotate="90deg" dim />
          </Animated.View>
          <Text
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 148,
              textAlign: 'center',
              fontFamily: fonts.display,
              fontSize: 26,
              color: colors.text2,
            }}
          >
            {step?.letter}
          </Text>
        </View>
      </View>

      <View style={{ paddingTop: 16, paddingHorizontal: 40 }}>
        <ActivityKicker label={step?.title ?? ''} />
        <View style={{ paddingTop: 14 }}>
          <ActivityPrompt>{step?.prompt ?? ''}</ActivityPrompt>
        </View>
      </View>

      {selected ? (
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 40,
            letterSpacing: -0.4,
            color: colors.text,
            textAlign: 'center',
            paddingTop: 28,
          }}
        >
          {selected}
        </Text>
      ) : (
        <View style={{ height: 68 }} />
      )}

      <View
        style={{
          height: 1.5,
          backgroundColor: colors.line,
          marginHorizontal: 60,
          marginTop: selected ? 16 : 0,
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingTop: 28 }}
      >
        {step?.options.map((option) => (
          <BudChip
            key={option}
            label={option}
            selected={selected === option}
            onPress={() => setAnswers((current) => ({ ...current, [step.key]: option }))}
          />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
        <BudButton
          label="Próximo"
          disabled={!selected}
          onPress={() => setIndex((current) => current + 1)}
        />
      </View>
    </View>
  );
}

function CompassLeaf({
  source,
  left,
  top,
  rotate,
  dim,
}: {
  source: ImageSourcePropType;
  left: number;
  top: number;
  rotate: string;
  dim?: boolean;
}) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{
        position: 'absolute',
        left,
        top,
        width: LEAF,
        height: LEAF,
        opacity: dim ? 0.35 : 0.95,
        transform: [{ rotate }],
      }}
    />
  );
}
