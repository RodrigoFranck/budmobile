import { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudButton, BudChip, BudIconButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { scoreInternal } from '@/pages/institution/screeningCatalog';
import { fonts, useV3Colors } from '@/theme';

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const step = STEPS[index];

  const finish = async () => {
    if (!user?.id) return;
    setSaving(true);
    await supabase.from('clinical_screenings' as never).insert({
      user_id: user.id,
      instrument: 'sleep',
      responses: answers,
      score_internal: scoreInternal(answers),
    } as never);
    setSaving(false);
    setDone(true);
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
      {done ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text }}>Obrigado</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 12 }}>
            O sono ficou registrado. Nada de pontuação aparece aqui.
          </Text>
          <BudButton label="Voltar" onPress={() => navigation.goBack()} style={{ marginTop: 32 }} />
        </View>
      ) : (
        <View style={{ marginTop: 24, flex: 1 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text3 }}>
            Check-in de sono · {index + 1} de {STEPS.length}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.text, marginTop: 12 }}>
            {step.title}
          </Text>
          {step.subtitle ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 10 }}>
              {step.subtitle}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
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
            label={index === STEPS.length - 1 ? 'Enviar' : 'Continuar'}
            disabled={!answers[step.key]}
            loading={saving}
            onPress={() => {
              if (index === STEPS.length - 1) {
                void finish();
                return;
              }
              setIndex((current) => current + 1);
            }}
          />
        </View>
      )}
    </View>
  );
}
