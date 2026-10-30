import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { invalidateDeclaredUserContext } from '@/lib/invalidateDeclaredUserContext';
import {
  SCREENINGS,
  scoreInternal,
  shouldOfferCrisisSupport,
  type ScreeningId,
} from '@/pages/institution/screeningCatalog';
import { SurveyChoice, SurveyHeader } from '@/pages/institution/surveyChrome';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabParamList, RootNavigationProp } from '@/types/navigation';

type Route = RouteProp<MainTabParamList, 'Screening'>;
type Phase = 'intro' | 'questions' | 'thanks';

export default function ScreeningFlowScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { g } = useGenderedCopy();
  const instrument = (route.params?.instrument ?? 'gad7') as ScreeningId;
  const catalog = SCREENINGS[instrument];
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const step = catalog.steps[index];

  const finish = async (nextAnswers: Record<string, string>) => {
    if (!user?.id) return;
    setSaving(true);
    const score = scoreInternal(nextAnswers);
    await supabase.from('clinical_screenings' as never).insert({
      user_id: user.id,
      instrument,
      responses: nextAnswers,
      score_internal: score,
    } as never);
    invalidateDeclaredUserContext(user.id);
    setSaving(false);
    setPhase('thanks');
    if (shouldOfferCrisisSupport(instrument, nextAnswers)) {
      rootNavigation.navigate('CrisisResources');
    }
  };

  const choose = (option: string) => {
    if (saving || !step) return;
    const nextAnswers = { ...answers, [step.key]: option };
    setAnswers(nextAnswers);
    if (index >= catalog.steps.length - 1) {
      void finish(nextAnswers);
      return;
    }
    setIndex((current) => current + 1);
  };

  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SurveyHeader title={catalog.title} onClose={() => navigation.goBack()} titleAlign="left" />
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
            {g(catalog.title)}
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
            {catalog.intro}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text,
              marginTop: 22,
            }}
          >
            {catalog.steps.length} perguntas. Você pode parar. Nada de pontuação aparece nesta tela.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <BudButton label="Começar" onPress={() => setPhase('questions')} />
        </View>
      </View>
    );
  }

  if (phase === 'thanks') {
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
            Suas respostas foram registradas. Nada de pontuação aparece aqui.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <BudButton label="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  if (!step) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SurveyHeader
        title={catalog.title}
        onBack={() => {
          if (index === 0) {
            setPhase('intro');
            return;
          }
          setIndex((current) => current - 1);
        }}
        progress={(index + 1) / catalog.steps.length}
      />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text2 }}>
          {index + 1} de {catalog.steps.length}
        </Text>
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
