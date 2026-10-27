import { useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { BudChip } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import {
  ACTIVITY_FOLLOWUPS,
  ACTIVITY_INTROS,
  VALUE_CARDS,
  VALUE_PILES,
  type ValueCard,
  type ValuePileKey,
} from '@/pages/activitiesV3/activityFlows';
import {
  ActivityFlowHeader,
  ActivityIntro,
  ActivityResult,
} from '@/pages/activitiesV3/activityChrome';
import { persistActivity } from '@/pages/activitiesV3/persistActivity';
import { activityColors, fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

const CARD_W = 324;
const CARD_H = 440;

export default function ValuesSortScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const intro = ACTIVITY_INTROS.ordenacao_valores;
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [deck, setDeck] = useState<ValueCard[]>(VALUE_CARDS);
  const [piles, setPiles] = useState<Record<ValuePileKey, string[]>>({
    muito: [],
    mais: [],
    menos: [],
  });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);
  const current = showHelp ? null : deck[0];
  const currentRef = useRef(current);
  currentRef.current = current;

  const drop = (pile: ValuePileKey) => {
    const card = currentRef.current;
    if (!card) return;
    setPiles((existing) => ({ ...existing, [pile]: [...existing[pile], card.title] }));
    setDeck((remaining) => remaining.slice(1));
    setOffset({ x: 0, y: 0 });
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          setOffset({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          if (showHelp) {
            setShowHelp(false);
            setOffset({ x: 0, y: 0 });
            return;
          }
          if (gesture.dy < -80) drop('muito');
          else if (gesture.dx > 90) drop('mais');
          else if (gesture.dx < -90) drop('menos');
          else setOffset({ x: 0, y: 0 });
        },
      }),
    [showHelp],
  );

  const remaining = showHelp ? VALUE_CARDS.length : deck.length;
  const done = started && !showHelp && !current;
  const result = VALUE_PILES.map((pile) => `${pile.label}: ${piles[pile.key].join(', ') || '—'}`).join(
    ' · ',
  );

  const persistOnce = async () => {
    if (saved.current || !user?.id) return;
    saved.current = true;
    await persistActivity({
      userId: user.id,
      activityId: 'ordenacao_valores',
      answers: {
        muito: piles.muito.join(','),
        mais: piles.mais.join(','),
        menos: piles.menos.join(','),
      },
      resultText: result,
    });
  };

  const talk = async (prompt: string) => {
    setSaving(true);
    await persistOnce();
    setSaving(false);
    navigateToChatTab(navigation, {
      chatInsight: {
        insightType: 'activity_ordenacao_valores',
        title: piles.muito.slice(0, 3).join(', ') || 'Valores',
        contextSummary: result,
        internalContext: result,
        initialUserMessage: prompt,
      },
    });
  };

  if (!started) {
    return (
      <ActivityIntro
        copy={intro}
        mist={assets.valoresMist}
        giz={assets.valoresGiz}
        onBack={() => navigation.goBack()}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (done) {
    return (
      <ActivityResult
        mist={assets.valoresMist}
        giz={assets.valoresGiz}
        insight="O que importa já está aí. Falta espaço"
        body={
          piles.muito.length
            ? `${piles.muito.join(', ')} são o seu chão. E o que está no "mais" pede lugar na semana.`
            : 'Você olhou para os valores. Guarde o que apareceu no muito e no mais.'
        }
        sectionLabel="Seus valores agora"
        followUps={ACTIVITY_FOLLOWUPS.ordenacao_valores}
        onBack={async () => {
          await persistOnce();
          navigation.goBack();
        }}
        onTalk={talk}
        talking={saving}
      >
        {VALUE_PILES.map((pile) => (
          <View key={pile.key} style={{ paddingTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11.5,
                  letterSpacing: 1.4,
                  color: pile.color,
                }}
              >
                {pile.label}
              </Text>
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text3 }}>
                {piles[pile.key].length}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12 }}>
              {piles[pile.key].map((item) => (
                <BudChip key={item} label={item} onPress={() => undefined} />
              ))}
            </View>
          </View>
        ))}
      </ActivityResult>
    );
  }

  const rotate = `${offset.x / 18}deg`;
  const hint =
    offset.y < -40 ? 'MUITO' : offset.x > 50 ? 'MAIS' : offset.x < -50 ? 'MENOS' : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ActivityFlowHeader closeOnLeft onClose={() => navigation.goBack()} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: CARD_W, height: CARD_H + 20 }}>
          {[4, 3, 2, 1].map((depth) => (
            <View
              key={depth}
              style={{
                position: 'absolute',
                left: depth * 2,
                top: 20 + depth * 6,
                width: CARD_W - depth * 4,
                height: CARD_H,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.bg,
              }}
            />
          ))}
          <View
            {...pan.panHandlers}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 18 },
              transform: [{ translateX: offset.x }, { translateY: offset.y }, { rotate }],
              paddingHorizontal: 31,
              alignItems: 'center',
            }}
          >
            {hint ? (
              <View style={{ paddingTop: 24 }}>
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 15,
                    letterSpacing: 1.4,
                    color:
                      hint === 'MUITO'
                        ? activityColors.menta
                        : hint === 'MAIS'
                          ? activityColors.folha
                          : activityColors.ardosia,
                  }}
                >
                  {hint}
                </Text>
              </View>
            ) : null}
            {showHelp ? (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 26,
                    lineHeight: 32,
                    letterSpacing: -0.4,
                    color: colors.text,
                    textAlign: 'center',
                    marginTop: 45,
                  }}
                >
                  Como funciona
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    lineHeight: 25,
                    color: colors.text2,
                    textAlign: 'center',
                    marginTop: 34,
                    width: 254,
                  }}
                >
                  Arraste cada carta na direção de quanto ela importa pra você agora.
                </Text>
                <Image
                  source={assets.valoresCardsGiz}
                  style={{ width: 140, height: 140, marginTop: 24 }}
                  resizeMode="contain"
                />
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 34,
                    lineHeight: 40,
                    letterSpacing: -0.4,
                    color: colors.text,
                    textAlign: 'center',
                    marginTop: 151,
                  }}
                >
                  {current?.title}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    lineHeight: 25,
                    color: colors.text2,
                    textAlign: 'center',
                    marginTop: 20,
                    width: 262,
                  }}
                >
                  {current?.body}
                </Text>
              </>
            )}
            <View
              style={{
                position: 'absolute',
                left: 25,
                right: 25,
                bottom: 24,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  color: activityColors.ardosia,
                }}
              >
                ← MENOS
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  color: activityColors.menta,
                }}
              >
                ↑ MUITO
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  color: activityColors.folha,
                }}
              >
                MAIS →
              </Text>
            </View>
          </View>
        </View>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 15,
            color: colors.text3,
            marginTop: 90,
          }}
        >
          {remaining} valores restantes
        </Text>
      </View>
    </View>
  );
}
