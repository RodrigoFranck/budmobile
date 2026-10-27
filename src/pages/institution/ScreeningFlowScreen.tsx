import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudButton, BudChip, BudIconButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  SCREENINGS,
  scoreInternal,
  shouldOfferCrisisSupport,
  type ScreeningId,
} from '@/pages/institution/screeningCatalog';
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
  const instrument = (route.params?.instrument ?? 'gad7') as ScreeningId;
  const catalog = SCREENINGS[instrument];
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const step = catalog.steps[index];

  const finish = async () => {
    if (!user?.id) return;
    setSaving(true);
    const score = scoreInternal(answers);
    await supabase.from('clinical_screenings' as never).insert({
      user_id: user.id,
      instrument,
      responses: answers,
      score_internal: score,
    } as never);
    setSaving(false);
    setPhase('thanks');
    if (shouldOfferCrisisSupport(instrument, answers)) {
      rootNavigation.navigate('CrisisResources');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={() => navigation.goBack()} />
      {phase === 'intro' ? (
        <View style={{ marginTop: 24, flex: 1 }}>
          <Image source={assets.gizCoracao} style={{ width: 96, height: 96 }} resizeMode="contain" />
          <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 12 }}>
            {catalog.title}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 12 }}>
            {catalog.intro}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.text3, marginTop: 16 }}>
            {catalog.steps.length} perguntas. Você pode parar. Nada de pontuação aparece nesta tela.
          </Text>
          <View style={{ flex: 1 }} />
          <BudButton label="Começar" onPress={() => setPhase('questions')} />
        </View>
      ) : null}

      {phase === 'questions' && step ? (
        <View style={{ marginTop: 24, flex: 1 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text3 }}>
            {index + 1} de {catalog.steps.length}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.text, marginTop: 12 }}>
            {step.title}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
            {step.options.map((option) => (
              <BudChip
                key={option}
                label={option}
                selected={answers[step.key] === option}
                onPress={() => setAnswers((current) => ({ ...current, [step.key]: option }))}
              />
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <BudButton
            label={index === catalog.steps.length - 1 ? 'Enviar' : 'Continuar'}
            disabled={!answers[step.key]}
            loading={saving}
            onPress={() => {
              if (index === catalog.steps.length - 1) {
                void finish();
                return;
              }
              setIndex((current) => current + 1);
            }}
          />
        </View>
      ) : null}

      {phase === 'thanks' ? (
        <View style={{ marginTop: 24, flex: 1 }}>
          <Image source={assets.gizOla} style={{ width: 96, height: 96 }} resizeMode="contain" />
          <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 12 }}>
            Obrigado
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 12 }}>
            Suas respostas foram registradas. Nada de pontuação aparece aqui.
          </Text>
          <View style={{ flex: 1 }} />
          <BudButton label="Voltar" onPress={() => navigation.goBack()} />
        </View>
      ) : null}
    </View>
  );
}
