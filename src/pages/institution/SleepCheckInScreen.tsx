import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { invalidateDeclaredUserContext } from '@/lib/invalidateDeclaredUserContext';
import { scoreInternal } from '@/pages/institution/screeningCatalog';
import { SurveyChoice, SurveyHeader } from '@/pages/institution/surveyChrome';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

const STEPS = [
  {
    key: 'quality',
    title: 'Como você dormiu?',
    subtitle: 'Sem nota. Só o que o corpo lembra.',
    options: ['Mal', 'Mais ou menos', 'Bem', 'Muito bem'],
  },
  {
    key: 'latency',
    title: 'Demorou para pegar no sono?',
    options: ['Não', 'Um pouco', 'Bastante', 'Quase não dormi'],
  },
  {
    key: 'awake',
    title: 'Acordou no meio da noite?',
    options: ['Não', 'Uma vez', 'Várias vezes'],
  },
  {
    key: 'rest',
    title: 'O corpo descansou?',
    options: ['Não', 'Um pouco', 'Sim'],
  },
];

export default function SleepCheckInScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const step = STEPS[index];

  const finish = async (nextAnswers: Record<string, string>) => {
    if (!user?.id) return;
    setSaving(true);
    await supabase.from('clinical_screenings' as never).insert({
      user_id: user.id,
      instrument: 'sleep',
      responses: nextAnswers,
      score_internal: scoreInternal(nextAnswers),
    } as never);
    invalidateDeclaredUserContext(user.id);
    setSaving(false);
    setDone(true);
  };

  const choose = (option: string) => {
    const nextAnswers = { ...answers, [step.key]: option };
    setAnswers(nextAnswers);
    if (index >= STEPS.length - 1) {
      void finish(nextAnswers);
      return;
    }
    setIndex((current) => current + 1);
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Image source={assets.healthSprout} style={{ width: 200, height: 200 }} resizeMode="contain" />
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.4,
              color: colors.text,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            Obrigado
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            O sono ficou registrado. Nada de pontuação aparece aqui.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <BudButton label="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SurveyHeader
        title="Check-in de sono"
        onBack={() => {
          if (index === 0) {
            navigation.goBack();
            return;
          }
          setIndex((current) => current - 1);
        }}
        progress={(index + 1) / STEPS.length}
      />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
        {step.subtitle ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
            {step.subtitle}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.4,
            color: colors.text,
            marginTop: step.subtitle ? 14 : 0,
          }}
        >
          {step.title}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ gap: 8 }}>
          {step.options.map((option) => (
            <SurveyChoice
              key={option}
              label={option}
              selected={answers[step.key] === option}
              onPress={() => choose(option)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
