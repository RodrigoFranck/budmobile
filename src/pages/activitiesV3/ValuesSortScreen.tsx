import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { BudChip } from '@/components/v3';
import { useAuth } from '@/contexts/AuthContext';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
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
import { activityEasing, activityMotion } from '@/pages/activitiesV3/activityMotion';
import { createActivityPersister } from '@/pages/activitiesV3/persistActivity';
import { activityColors, fonts, useV3Asset, useV3Colors, type V3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

const CARD_W = 324;
const CARD_H = 440;
const SWIPE_X = 90;
const SWIPE_Y = 80;
const FLICK = 850;

type LeavePile = ValuePileKey | 'help';

export default function ValuesSortScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();
  const intro = ACTIVITY_INTROS.ordenacao_valores;
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [pendingPile, setPendingPile] = useState<LeavePile | null>(null);
  const [deck, setDeck] = useState<ValueCard[]>(VALUE_CARDS);
  const [piles, setPiles] = useState<Record<ValuePileKey, string[]>>({
    muito: [],
    mais: [],
    menos: [],
  });
  const [saving, setSaving] = useState(false);
  const saveActivity = useRef(createActivityPersister()).current;
  const flying = pendingPile !== null;
  const current = showHelp ? null : deck[0];
  const currentRef = useRef(current);
  currentRef.current = current;
  const leavingTitle = useRef<string | null>(null);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const followFly = useSharedValue(0);
  const busy = useSharedValue(false);

  const drop = useCallback((pile: ValuePileKey) => {
    const card = currentRef.current;
    if (!card) return;
    setPiles((existing) => ({ ...existing, [pile]: [...existing[pile], card.title] }));
    setDeck((remaining) => remaining.slice(1));
  }, []);

  const beginFly = useCallback((pile: LeavePile) => {
    leavingTitle.current = pile === 'help' ? 'help' : currentRef.current?.title ?? null;
    setPendingPile(pile);
  }, []);

  const endFly = useCallback(
    (pile: LeavePile) => {
      if (pile === 'help') setShowHelp(false);
      else drop(pile);
    },
    [drop],
  );

  useLayoutEffect(() => {
    if (!pendingPile) return;
    const gone =
      pendingPile === 'help' ? !showHelp : leavingTitle.current !== deck[0]?.title;
    if (!gone) return;
    followFly.value = 0;
    flyX.value = 0;
    flyY.value = 0;
    x.value = 0;
    y.value = 0;
    busy.value = false;
    leavingTitle.current = null;
    setPendingPile(null);
  }, [busy, deck, flyX, flyY, followFly, pendingPile, showHelp, x, y]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (busy.value) return;
          x.value = event.translationX;
          y.value = event.translationY;
        })
        .onFinalize((event) => {
          if (busy.value) return;
          const dx = x.value;
          const dy = y.value;
          const vx = event.velocityX;
          const vy = event.velocityY;
          const pile: LeavePile | null = showHelp
            ? 'help'
            : dy < -SWIPE_Y || (dy < -36 && vy < -FLICK)
              ? 'muito'
              : dx > SWIPE_X || (dx > 40 && vx > FLICK)
                ? 'mais'
                : dx < -SWIPE_X || (dx < -40 && vx < -FLICK)
                  ? 'menos'
                  : null;
          if (!pile) {
            const back = { duration: activityMotion.cardReturnMs, easing: activityEasing.gentle };
            x.value = withTiming(0, back);
            y.value = withTiming(0, back);
            return;
          }
          busy.value = true;
          const follow = activityMotion.cardFollowPx;
          let toX = dx;
          let toY = dy;
          if (pile === 'mais') toX = dx + follow;
          else if (pile === 'menos') toX = dx - follow;
          else if (pile === 'muito') toY = dy - follow;
          else {
            const dist = Math.hypot(dx, dy);
            if (dist < 12) toY = dy - follow * 0.7;
            else {
              toX = dx + (dx / dist) * follow;
              toY = dy + (dy / dist) * follow;
            }
          }
          flyX.value = dx;
          flyY.value = dy;
          followFly.value = 1;
          x.value = 0;
          y.value = 0;
          const leave = { duration: activityMotion.cardExitMs, easing: activityEasing.gentle };
          flyX.value = withTiming(toX, leave);
          flyY.value = withTiming(toY, leave, (finished) => {
            if (finished) runOnJS(endFly)(pile);
          });
          runOnJS(beginFly)(pile);
        }),
    [beginFly, busy, endFly, flyX, flyY, followFly, showHelp, x, y],
  );

  const remaining = showHelp ? VALUE_CARDS.length : deck.length;
  const done = started && !showHelp && !current && !flying;
  const result = VALUE_PILES.map((pile) => `${pile.label}: ${piles[pile.key].join(', ') || '—'}`).join(
    ' · ',
  );

  const persistOnce = async () => {
    if (!user?.id) return;
    await saveActivity({
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

  useEffect(() => {
    if (done) void persistOnce();
  }, [done]);

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

  const dragOrFlyStyle = useAnimatedStyle(() => {
    const px = followFly.value ? flyX.value : x.value;
    const py = followFly.value ? flyY.value : y.value;
    return {
      transform: [
        { translateX: px },
        { translateY: py },
        { rotate: `${px / activityMotion.cardTiltDiv}deg` },
      ],
    };
  });

  const muitoStamp = useAnimatedStyle(() => {
    const py = followFly.value ? flyY.value : y.value;
    return { opacity: interpolate(py, [-28, -SWIPE_Y], [0, 1], Extrapolation.CLAMP) };
  });
  const maisStamp = useAnimatedStyle(() => {
    const px = followFly.value ? flyX.value : x.value;
    return { opacity: interpolate(px, [32, SWIPE_X], [0, 1], Extrapolation.CLAMP) };
  });
  const menosStamp = useAnimatedStyle(() => {
    const px = followFly.value ? flyX.value : x.value;
    return { opacity: interpolate(px, [-32, -SWIPE_X], [0, 1], Extrapolation.CLAMP) };
  });

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

  const visibleCards = showHelp ? deck.slice(0, 1) : deck.slice(0, 2);
  const stamps = (
    <>
      <Animated.Text
        pointerEvents="none"
        style={[
          stampStyle,
          { top: 22, left: 0, right: 0, textAlign: 'center', color: activityColors.menta },
          muitoStamp,
        ]}
      >
        MUITO
      </Animated.Text>
      <Animated.Text
        pointerEvents="none"
        style={[
          stampStyle,
          { top: 36, left: 22, color: activityColors.folha, transform: [{ rotate: '-8deg' }] },
          maisStamp,
        ]}
      >
        MAIS
      </Animated.Text>
      <Animated.Text
        pointerEvents="none"
        style={[
          stampStyle,
          { top: 36, right: 22, color: activityColors.ardosia, transform: [{ rotate: '8deg' }] },
          menosStamp,
        ]}
      >
        MENOS
      </Animated.Text>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ActivityFlowHeader closeOnLeft onClose={() => navigation.goBack()} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={{ width: CARD_W, height: CARD_H + 20, overflow: 'visible' }}>
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
            {visibleCards.map((card, index) => {
              const isLeaving = flying && card.title === leavingTitle.current;
              const isFront = !showHelp && !flying && index === 0;
              const moving = isFront || isLeaving;
              return (
                <Animated.View
                  key={card.title}
                  pointerEvents="none"
                  style={[
                    cardChrome(colors, moving),
                    moving ? dragOrFlyStyle : null,
                  ]}
                >
                  <ValueCardBody card={card} colors={colors} />
                  {moving ? stamps : null}
                  {moving ? <CardHints /> : null}
                </Animated.View>
              );
            })}
            {showHelp ? (
              <Animated.View style={[cardChrome(colors, true), dragOrFlyStyle]}>
                {stamps}
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
                <CardHints />
              </Animated.View>
            ) : null}
          </Animated.View>
        </GestureDetector>
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

const stampStyle = {
  position: 'absolute' as const,
  fontFamily: fonts.sansSemi,
  fontSize: 15,
  letterSpacing: 1.4,
};

function cardChrome(colors: V3Colors, front: boolean) {
  return {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
    zIndex: front ? 2 : 1,
    shadowColor: '#000',
    shadowOpacity: front ? 0.25 : 0,
    shadowRadius: front ? 20 : 0,
    shadowOffset: { width: 0, height: front ? 18 : 0 },
  };
}

function CardHints() {
  return (
    <View
      pointerEvents="none"
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
  );
}

function ValueCardBody({ card, colors }: { card: ValueCard; colors: V3Colors }) {
  const { g } = useGenderedCopy();
  return (
    <>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          fontFamily: fonts.display,
          fontSize: 34,
          lineHeight: 40,
          letterSpacing: -0.4,
          color: colors.text,
          textAlign: 'center',
          marginTop: 151,
          width: CARD_W - 24,
        }}
      >
        {card.title}
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
        {g(card.body)}
      </Text>
    </>
  );
}
