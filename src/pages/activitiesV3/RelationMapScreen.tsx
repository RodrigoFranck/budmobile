import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GripVertical } from 'lucide-react-native';

import { BudButton } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  RELATION_FREQUENCY,
  RELATION_ROLES,
  RELATION_TYPES,
  relationRankingItems,
} from '@/pages/activitiesV3/activityFlows';
import {
  ActivityFlowHeader,
  ActivityIntro,
  ActivityKicker,
  ActivityOptionRow,
  ActivityPrompt,
  ActivityResult,
  ResultEntry,
} from '@/pages/activitiesV3/activityChrome';
import { persistActivity } from '@/pages/activitiesV3/persistActivity';
import { activityColors, fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

type Step =
  | 'intro'
  | 'tipo'
  | 'nome'
  | 'idade'
  | 'matriz1'
  | 'ranking'
  | 'papel'
  | 'matriz2'
  | 'frequencia'
  | 'result';

const STEPS: Step[] = [
  'tipo',
  'nome',
  'idade',
  'matriz1',
  'ranking',
  'papel',
  'matriz2',
  'frequencia',
];
const MAP = 360;
const PUCK = 48;

export default function RelationMapScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const intro = ACTIVITY_INTROS.mapa_relacoes;
  const [step, setStep] = useState<Step>('intro');
  const [tipo, setTipo] = useState('');
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [papel, setPapel] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [matriz1, setMatriz1] = useState({ x: 0.62, y: 0.22 });
  const [matriz2, setMatriz2] = useState({ x: 0.28, y: 0.58 });
  const [ranking, setRanking] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);

  const person = nome.trim() || 'essa pessoa';
  const stepIndex = STEPS.indexOf(step);
  const progress = stepIndex <= 0 ? 0 : stepIndex / (STEPS.length - 1);

  const rankingItems = useMemo(() => {
    if (ranking.length) return ranking;
    return relationRankingItems(person);
  }, [person, ranking]);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (step === 'nome' && !ranking.length) {
      setRanking(relationRankingItems(nome.trim() || 'essa pessoa'));
    }
    if (next) setStep(next);
    else setStep('result');
  };

  const canContinue = () => {
    if (step === 'tipo') return Boolean(tipo);
    if (step === 'nome') return Boolean(nome.trim());
    if (step === 'idade') return Boolean(idade.trim());
    if (step === 'papel') return Boolean(papel);
    if (step === 'frequencia') return Boolean(frequencia);
    return true;
  };

  const resultText = `${tipo} · ${person} · ${papel} · ${frequencia}`;

  const persistOnce = async () => {
    if (saved.current || !user?.id) return;
    saved.current = true;
    await persistActivity({
      userId: user.id,
      activityId: 'mapa_relacoes',
      answers: {
        tipo,
        nome: person,
        idade,
        papel,
        frequencia,
        ranking: rankingItems.join('|'),
        matriz1: `${matriz1.x.toFixed(2)},${matriz1.y.toFixed(2)}`,
        matriz2: `${matriz2.x.toFixed(2)},${matriz2.y.toFixed(2)}`,
      },
      resultText,
    });
  };

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_mapa_relacoes',
        title: person,
        contextSummary: resultText,
        internalContext: resultText,
        initialUserMessage: prompt,
      },
    });
  };

  if (step === 'intro') {
    return (
      <ActivityIntro
        copy={intro}
        mist={assets.mapaMist}
        giz={assets.mapaGiz}
        onBack={() => navigation.goBack()}
        onStart={() => setStep('tipo')}
      />
    );
  }

  if (step === 'result') {
    return (
      <ActivityResult
        mist={assets.mapaMist}
        giz={assets.mapaGiz}
        insight={`Olhar para ${person} já muda o tamanho da relação`}
        body={`Você escolheu ${tipo.toLowerCase()} com ${person}. ${papel}. ${frequencia}. Isso já é um mapa.`}
        sectionLabel="O que mais importa"
        followUps={ACTIVITY_FOLLOWUPS.mapa_relacoes}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        <ResultEntry label="Relação" value={`${tipo} · ${person}`} colors={colors} />
        <ResultEntry label="Papel" value={papel} colors={colors} />
        <ResultEntry label="Frequência" value={frequencia} colors={colors} />
      </ActivityResult>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 16) }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ActivityFlowHeader
        title="Mapa de Relações"
        onBack={() => {
          if (stepIndex <= 0) setStep('intro');
          else setStep(STEPS[stepIndex - 1]);
        }}
        onClose={() => navigation.goBack()}
        progress={progress}
      />

      {step === 'tipo' || step === 'papel' || step === 'frequencia' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}>
          <ActivityKicker
            label="Escolha uma opção"
          />
          <View style={{ paddingTop: 12, paddingRight: 4 }}>
            <ActivityPrompt align="left">
              {step === 'tipo'
                ? 'Qual relação você quer olhar hoje?'
                : step === 'papel'
                  ? `No dia a dia, que lugar você ocupa nessa amizade?`
                  : `Nos últimos meses, com que frequência você deixou de contar o que estava sentindo?`}
            </ActivityPrompt>
          </View>
          <View style={{ gap: 10, paddingTop: 56 }}>
            {(step === 'tipo' ? RELATION_TYPES : step === 'papel' ? RELATION_ROLES : RELATION_FREQUENCY).map(
              (option) => (
                <ActivityOptionRow
                  key={option}
                  label={option}
                  selected={
                    step === 'tipo' ? tipo === option : step === 'papel' ? papel === option : frequencia === option
                  }
                  onPress={() => {
                    if (step === 'tipo') setTipo(option);
                    else if (step === 'papel') setPapel(option);
                    else setFrequencia(option);
                  }}
                />
              ),
            )}
          </View>
        </ScrollView>
      ) : null}

      {step === 'nome' || step === 'idade' ? (
        <View style={{ flex: 1, paddingTop: 88 }}>
          <ActivityPrompt>
            {step === 'nome' ? 'Qual é o nome dela?' : `Quantos anos ${person} tem?`}
          </ActivityPrompt>
          <TextInput
            value={step === 'nome' ? nome : idade}
            onChangeText={step === 'nome' ? setNome : setIdade}
            placeholder={step === 'nome' ? 'Nome' : 'Idade'}
            placeholderTextColor={colors.text3}
            keyboardType={step === 'idade' ? 'number-pad' : 'default'}
            autoFocus
            style={{
              marginTop: 78,
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              letterSpacing: -0.4,
              color: colors.text,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          />
          <View
            style={{
              height: 2,
              backgroundColor: colors.line,
              marginHorizontal: 90,
              marginTop: 16,
            }}
          />
        </View>
      ) : null}

      {step === 'matriz1' || step === 'matriz2' ? (
        <View style={{ flex: 1, paddingTop: 20, paddingHorizontal: 28 }}>
          <ActivityKicker label="Arraste para posicionar" />
          <View style={{ paddingTop: 12 }}>
            <ActivityPrompt align="left">
              {step === 'matriz1'
                ? `Onde está a sua amizade com ${person} agora?`
                : `Quando vocês conversam, quanto você consegue ser você?`}
            </ActivityPrompt>
          </View>
          <View style={{ alignItems: 'center', paddingTop: 36 }}>
            <AxisMap
              value={step === 'matriz1' ? matriz1 : matriz2}
              onChange={step === 'matriz1' ? setMatriz1 : setMatriz2}
              labels={
                step === 'matriz1'
                  ? {
                      top: 'Muito importante',
                      bottom: 'Menos importante',
                      left: 'Menos feliz',
                      right: 'Muito feliz',
                    }
                  : {
                      top: 'Ela também se abre',
                      bottom: 'Só eu me abro',
                      left: 'Com cuidado',
                      right: 'À vontade',
                    }
              }
              puckColor={activityColors.ardosia}
            />
          </View>
        </View>
      ) : null}

      {step === 'ranking' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}>
          <ActivityKicker label="Arraste para reordenar" />
          <View style={{ paddingTop: 12, paddingRight: 8 }}>
            <ActivityPrompt align="left">{`O que mais importa pra você nessa amizade?`}</ActivityPrompt>
          </View>
          <View style={{ gap: 10, paddingTop: 56 }}>
            {rankingItems.map((item, i) => (
              <View
                key={item}
                style={{
                  minHeight: 76,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 18,
                  gap: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 26,
                    color: colors.text2,
                    width: 20,
                  }}
                >
                  {i + 1}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    lineHeight: 22,
                    color: colors.text,
                  }}
                >
                  {item}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mover para cima"
                  onPress={() => {
                    if (i === 0) return;
                    setRanking((current) => {
                      const next = [...(current.length ? current : rankingItems)];
                      const [moved] = next.splice(i, 1);
                      next.splice(i - 1, 0, moved);
                      return next;
                    });
                  }}
                >
                  <GripVertical color={colors.text3} size={22} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={{ paddingHorizontal: 24 }}>
        <BudButton label="Continuar" disabled={!canContinue()} onPress={goNext} />
      </View>
    </KeyboardAvoidingView>
  );
}

function AxisMap({
  value,
  onChange,
  labels,
  puckColor,
}: {
  value: { x: number; y: number };
  onChange: (next: { x: number; y: number }) => void;
  labels: { top: string; bottom: string; left: string; right: string };
  puckColor: string;
}) {
  const colors = useV3Colors();
  const origin = useRef(value);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          origin.current = value;
        },
        onPanResponderMove: (_, gesture) => {
          onChange({
            x: Math.min(1, Math.max(0, origin.current.x + gesture.dx / MAP)),
            y: Math.min(1, Math.max(0, origin.current.y + gesture.dy / MAP)),
          });
        },
      }),
    [onChange, value],
  );

  return (
    <View style={{ width: MAP, height: MAP }}>
      <Text style={[axisLabel, { top: 16, color: colors.text3, width: MAP, textAlign: 'center' }]}>
        {labels.top}
      </Text>
      <Text style={[axisLabel, { bottom: 16, color: colors.text3, width: MAP, textAlign: 'center' }]}>
        {labels.bottom}
      </Text>
      <Text
        style={[
          axisLabel,
          { left: 14, top: MAP / 2 - 17, color: colors.text3, width: 64, textAlign: 'left' },
        ]}
      >
        {labels.left}
      </Text>
      <Text
        style={[
          axisLabel,
          { right: 14, top: MAP / 2 - 17, color: colors.text3, width: 64, textAlign: 'right' },
        ]}
      >
        {labels.right}
      </Text>
      <View
        style={{
          position: 'absolute',
          left: MAP / 2,
          top: 46,
          bottom: 46,
          width: 1.5,
          backgroundColor: colors.line,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: MAP / 2,
          left: 46,
          right: 46,
          height: 1.5,
          backgroundColor: colors.line,
        }}
      />
      <View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: 46 + value.x * (MAP - 92 - PUCK),
          top: 46 + value.y * (MAP - 92 - PUCK),
          width: PUCK,
          height: PUCK,
          borderRadius: 24,
          backgroundColor: puckColor,
        }}
      />
    </View>
  );
}

const axisLabel = {
  position: 'absolute' as const,
  fontFamily: fonts.sansSemi,
  fontSize: 13,
  lineHeight: 17,
};
