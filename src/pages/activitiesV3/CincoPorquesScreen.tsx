import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
  Glow,
  ResultEntry,
} from '@/pages/activitiesV3/activityChrome';
import { persistActivity } from '@/pages/activitiesV3/persistActivity';
import { fonts, motion, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

export default function CincoPorquesScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const [index, setIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const saved = useRef(false);
  const intro = ACTIVITY_INTROS.cinco_porques;
  const step = index >= 0 && index < CINCO_PORQUES.length ? CINCO_PORQUES[index] : null;
  const done = index >= CINCO_PORQUES.length;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: motion.questionStepMs,
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || !step) return;
    setAnswers((current) => [...current, trimmed]);
    setDraft('');
    setIndex((current) => current + 1);
  };

  const first = answers[0] ?? '';
  const last = answers[answers.length - 1] ?? '';
  const resultText = answers.join(' · ');

  const persistOnce = async () => {
    if (saved.current || !user?.id) return;
    saved.current = true;
    await persistActivity({
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

  if (done) {
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
            <ResultEntry key={item.key} label={item.title} value={answers[i]} colors={colors} />
          ) : null,
        )}
      </ActivityResult>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Glow color={colors.accent} style={{ top: -60, alignSelf: 'center', left: 10 }} />
      <ActivityFlowHeader title="Cinco Porquês" onClose={() => navigation.goBack()} />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        {answers.length ? (
          <ScrollView
            style={{ flexGrow: 0, maxHeight: 220 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
          >
            {answers.map((answer, i) => (
              <View key={`${CINCO_PORQUES[i].key}-prev`} style={{ paddingTop: 16 }}>
                <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 18, color: colors.text2 }}>
                  {CINCO_PORQUES[i].title}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    lineHeight: 24,
                    color: colors.text,
                    paddingTop: 6,
                  }}
                >
                  {answer}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={{ flex: 1, justifyContent: answers.length ? 'flex-start' : 'flex-start', paddingTop: answers.length ? 40 : 88 }}>
          <ActivityKicker label={step?.kicker ?? ''} />
          <View style={{ paddingHorizontal: 36, paddingTop: 12 }}>
            <ActivityPrompt>{step?.title ?? ''}</ActivityPrompt>
          </View>
        </View>
      </Animated.View>
      <ActivityComposer
        value={draft}
        onChangeText={setDraft}
        onSend={submit}
        placeholder={step?.placeholder}
      />
    </KeyboardAvoidingView>
  );
}
