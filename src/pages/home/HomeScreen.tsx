import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Menu } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { firstGivenName } from '@/copy/nameGender';
import { useBootSplash } from '@/contexts/BootSplashContext';
import { useTabScreenContext, useTabScreenLoading } from '@/contexts/TabScreenContext';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { useHomeRecaps, type HomeRecapItem } from '@/hooks/useHomeRecaps';
import { fonts, useV3Asset, useV3Colors, v3DarkColors, type V3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import LetterCeremony, { LETTER_HOME, type LetterOrigin } from '@/pages/letter/LetterCeremony';
import { HomeArrowIcon, HomeChatFillIcon } from '@/pages/home/homeIcons';
import { openHomeRecapChat } from '@/utils/buildHomeRecapChatInsight';
import {
  getNowInBrasilia,
  getWeekStartBrasilia,
  getYesterdayInBrasilia,
  parseDateString,
} from '@/utils/dateUtils';
import { navigateToChatTab } from '@/utils/navigateToChat';

type RecapItem = HomeRecapItem;

const RECAP_FOOTER =
  'Esses convites vêm das suas conversas dos últimos dias e semanas. Guardamos até 10; até 3 novos por dia.';
const EMPTY_LETTER_TITLE = 'A carta de amanhã começa ';
const EMPTY_LETTER_BODY =
  'O Bud escreve sua carta de madrugada, a partir do que vocês conversarem. Que tal começar agora?';

function greetingForHour(date = getNowInBrasilia()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function conversationDay(dateSource: string) {
  return dateSource.includes('T') ? dateSource.split('T')[0] : dateSource;
}

function recapDateLabel(dateSource: string) {
  const dateStr = conversationDay(dateSource);
  if (dateStr === getYesterdayInBrasilia()) return 'Ontem';

  const date = parseDateString(dateStr);
  const weekStart = getWeekStartBrasilia(getNowInBrasilia());
  if (date >= weekStart) {
    return capitalizeFirst(format(date, 'EEEE', { locale: ptBR }).split('-')[0]);
  }

  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  if (date >= previousWeekStart) return 'Semana passada';

  const twoWeeksAgo = new Date(weekStart);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  if (date >= twoWeeksAgo) return 'Há 2 semanas';

  return 'Antes';
}

function quoted(text: string) {
  const trimmed = text.trim().replace(/^[“”"']+|[“”"']+$/g, '');
  if (!trimmed) return '';
  return `“${trimmed}”`;
}

function RecapCard({
  item,
  colors,
  disabled,
  onPress,
}: {
  item: RecapItem;
  colors: V3Colors;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversar sobre ${item.quote}`}
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 24,
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 14,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemi,
          fontSize: 11.5,
          lineHeight: 12,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: colors.text3,
        }}
      >
        {item.label}
      </Text>
      <View
        style={{
          marginTop: 10,
          borderLeftWidth: 2,
          borderLeftColor: colors.accent,
          paddingLeft: 12,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.sansItalic,
            fontSize: 14.5,
            lineHeight: 20,
            color: colors.text2,
          }}
        >
          {quoted(item.quote)}
        </Text>
      </View>
      <Text
        numberOfLines={4}
        style={{
          marginTop: 12,
          fontFamily: fonts.sans,
          fontSize: 15,
          lineHeight: 22,
          color: colors.text,
        }}
      >
        {item.body}
      </Text>
      <View
        style={{
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 40,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sansSemi,
            fontSize: 14.5,
            lineHeight: 15,
            color: colors.accent,
          }}
        >
          Conversar sobre isso
        </Text>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 24,
            backgroundColor: colors.btn,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HomeArrowIcon color={colors.onBtn} />
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<MainTabNavigationProp>();
  const tabLoading = useTabScreenLoading('Home');
  const {
    profile,
    yesterdayInsight,
    conversations,
    conversationsLoading,
    historyTitlesLoading,
  } = useTabScreenContext();
  const { available: hasLetter, loading: letterLoading } = useDailyLetter();
  const conversationsReady = !conversationsLoading && !historyTitlesLoading;
  const { g } = useGenderedCopy();
  const firstName = firstGivenName(profile?.name ?? '') || 'você';
  const greeting = greetingForHour();
  const [greetingLead, greetingAccent] = greeting.split(' ');

  const [openingRecapId, setOpeningRecapId] = useState<string | null>(null);
  const [letterOrigin, setLetterOrigin] = useState<LetterOrigin | null>(null);
  const [recapStuck, setRecapStuck] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { setMainTabsReady } = useBootSplash();
  const envelopeRef = useRef<View>(null);
  const homeRootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const recapOffsetRef = useRef<number | null>(null);
  const envW = windowWidth - 40;
  const envH = envW * (LETTER_HOME.envH / LETTER_HOME.envW);
  const sealSize = envW * (LETTER_HOME.seal / LETTER_HOME.envW);
  const sealTop = envH * (LETTER_HOME.sealTop / LETTER_HOME.envH);

  const openLetter = useCallback(() => {
    const fallback: LetterOrigin = {
      x: (windowWidth - envW) / 2,
      y: insets.top + 196,
      width: envW,
      height: envH,
    };
    const root = homeRootRef.current;
    const node = envelopeRef.current;
    if (!root || !node) {
      setLetterOrigin(fallback);
      return;
    }
    root.measureInWindow((rootX, rootY) => {
      node.measureInWindow((x, y, width, height) => {
        if (width < 40 || height < 40) {
          setLetterOrigin(fallback);
          return;
        }
        setLetterOrigin({
          x: x - rootX,
          y: y - rootY,
          width,
          height,
        });
      });
    });
  }, [envH, envW, insets.top, windowWidth]);

  const { recaps, recapCountLabel, loading: recapsLoading } = useHomeRecaps({
    conversations,
    yesterdayInsight,
    hasLetter,
    conversationsReady,
    dateLabel: recapDateLabel,
  });
  const contentReady = !tabLoading && !letterLoading && !recapsLoading;
  if (contentReady && !revealed) {
    setRevealed(true);
  }

  useEffect(() => {
    if (!revealed) return;
    setMainTabsReady(true);
  }, [revealed, setMainTabsReady]);

  const openRecap = useCallback(
    async (item: RecapItem) => {
      if (openingRecapId) return;
      setOpeningRecapId(item.id);
      try {
        if (item.kind === 'yesterday') {
          await openHomeRecapChat(navigation, {
            kind: 'yesterday',
            insight:
              yesterdayInsight && !yesterdayInsight.locked
                ? yesterdayInsight
                : {
                    title: item.quote,
                    description: item.body,
                    locked: false,
                  },
          });
          return;
        }

        await openHomeRecapChat(navigation, {
          kind: 'conversation',
          conversationId: item.id,
          title: item.quote,
          dateLabel: item.label,
          cardDescription: item.body,
        });
      } finally {
        setOpeningRecapId(null);
      }
    },
    [navigation, openingRecapId, yesterdayInsight],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const recapOffset = recapOffsetRef.current;
    if (recapOffset == null) {
      setRecapStuck(false);
      return;
    }
    const nextStuck = event.nativeEvent.contentOffset.y >= recapOffset - 8;
    setRecapStuck((current) => (current === nextStuck ? current : nextStuck));
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const scrollToRecaps = useCallback(() => {
    const recapOffset = recapOffsetRef.current;
    if (recapOffset == null) return;
    scrollRef.current?.scrollTo({ y: recapOffset, animated: true });
  }, []);

  if (!revealed) {
    return (
      <View
        style={{ flex: 1, backgroundColor: v3DarkColors.bg }}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando conteúdo"
      />
    );
  }

  return (
    <View ref={homeRootRef} collapsable={false} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg,
            borderBottomWidth: recapStuck ? 1 : 0,
            borderBottomColor: colors.line,
            paddingBottom: recapStuck ? 8 : 0,
          }}
        >
          <View
            style={{
              height: 56,
              marginTop: 4,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <BudIconButton
              icon={Menu}
              accessibilityLabel="Menu"
              onPress={() => navigation.navigate('Menu')}
            />
            {recapStuck ? (
              <Pressable
                onPress={scrollToTop}
                accessibilityRole="button"
                accessibilityLabel="Voltar ao topo"
                style={{ paddingLeft: 14, flex: 1, justifyContent: 'center' }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 11.5,
                    lineHeight: 12,
                    letterSpacing: 1.6,
                    textTransform: 'uppercase',
                    color: colors.text3,
                  }}
                >
                  {`Para começar · ${recapCountLabel}`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 46,
              lineHeight: 52,
              letterSpacing: -0.4,
              color: colors.text,
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            {greetingLead}{' '}
            <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>{greetingAccent}</Text>
            , {firstName}
          </Text>

          <Text
            style={{
              fontFamily: fonts.sansMedium,
              fontSize: 15,
              lineHeight: 15,
              color: colors.text3,
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {hasLetter ? (
          <Pressable
            onPress={openLetter}
            accessibilityRole="button"
            accessibilityLabel="Abrir carta de hoje"
            style={{ alignItems: 'center', marginTop: 20, opacity: letterOrigin ? 0 : 1 }}
          >
            <View ref={envelopeRef} collapsable={false} style={{ width: envW, height: envH }}>
              <Image
                source={assets.envelopeClosed}
                style={{ width: envW, height: envH }}
                resizeMode="contain"
              />
              <Image
                source={assets.waxSeal}
                style={{
                  position: 'absolute',
                  width: sealSize,
                  height: sealSize,
                  left: (envW - sealSize) / 2,
                  top: sealTop,
                  transform: [{ rotate: `${LETTER_HOME.sealRotate}deg` }],
                }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 11.5,
                lineHeight: 12,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: colors.text3,
                marginTop: 11,
              }}
            >
              Toque para abrir a carta de hoje
            </Text>
          </Pressable>
          ) : (
          <View style={{ alignItems: 'center', marginTop: 23, paddingHorizontal: 20 }}>
            <Image source={assets.gizMoon} style={{ width: 100, height: 100 }} resizeMode="contain" />
            <Text
              style={{
                marginTop: 12,
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 32,
                letterSpacing: -0.4,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {EMPTY_LETTER_TITLE}
              <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>hoje</Text>
            </Text>
            <Text
              style={{
                marginTop: 12,
                maxWidth: 352,
                fontFamily: fonts.sans,
                fontSize: 15,
                lineHeight: 22,
                color: colors.text2,
                textAlign: 'center',
              }}
            >
              {EMPTY_LETTER_BODY}
            </Text>
            <Pressable
              onPress={() => navigateToChatTab(navigation, {})}
              accessibilityRole="button"
              accessibilityLabel="Conversar com o Bud"
              style={{
                marginTop: 12,
                height: 44,
                width: 210,
                borderRadius: 29,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, lineHeight: 15, color: colors.onAccent }}>
                Conversar com o Bud
              </Text>
            </Pressable>
          </View>
          )}

          {recaps.length > 0 ? (
          <View
            onLayout={(event) => {
              recapOffsetRef.current = event.nativeEvent.layout.y;
            }}
            style={{ marginTop: hasLetter ? 36 : 32 }}
          >
            <View
              style={{
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11.5,
                  lineHeight: 12,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: colors.text3,
                }}
              >
                Para começar
              </Text>
              <Pressable
                onPress={scrollToRecaps}
                accessibilityRole="button"
                accessibilityLabel={`Ver todos, ${recapCountLabel}`}
                style={{ flex: 1, alignItems: 'flex-end' }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansMedium,
                    fontSize: 12.5,
                    lineHeight: 13,
                    color: colors.text3,
                  }}
                >
                  {recapCountLabel}
                </Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 17, gap: 12 }}>
              {recaps.map((item) => (
                <RecapCard
                  key={item.id}
                  item={{
                    ...item,
                    quote: item.kind === 'yesterday' ? g(item.quote) : item.quote,
                    body: g(item.body),
                  }}
                  colors={colors}
                  disabled={openingRecapId === item.id}
                  onPress={() => {
                    void openRecap(item);
                  }}
                />
              ))}
            </View>

            <Text
              style={{
                marginTop: 26,
                paddingHorizontal: 40,
                fontFamily: fonts.sans,
                fontSize: 13.5,
                lineHeight: 20,
                color: colors.text3,
                textAlign: 'center',
              }}
            >
              {RECAP_FOOTER}
            </Text>
          </View>
          ) : null}
        </ScrollView>

        <Pressable
          onPress={() => navigateToChatTab(navigation, {})}
          accessibilityRole="button"
          accessibilityLabel="Chat"
          style={{
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 24,
            height: 56,
            paddingLeft: 20,
            paddingRight: 24,
            borderRadius: 28,
            backgroundColor: colors.accent,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 10,
          }}
        >
          <HomeChatFillIcon color={colors.onAccent} />
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 18, lineHeight: 18, color: colors.onAccent }}>
            Chat
          </Text>
        </Pressable>
      </View>
      {letterOrigin ? (
        <LetterCeremony origin={letterOrigin} onClose={() => setLetterOrigin(null)} />
      ) : null}
    </View>
  );
}
