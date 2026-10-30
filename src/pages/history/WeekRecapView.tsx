import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { useDeepInsight } from '@/hooks/useDeepInsight';
import { formatWeekRangeLong, type HistoryWeekDot } from '@/hooks/useHistoryDays';
import { HistoryMessageIcon, HistoryShareIcon } from '@/pages/history/historyIcons';
import { AccentTitle } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { openDeepInsightChat } from '@/utils/buildDeepInsightChatInsight';
import { getWeekEndBrasilia, parseDateString } from '@/utils/dateUtils';

type WeekRecapViewProps = {
  weekStart: string;
  firstName: string;
  weekDots: HistoryWeekDot[];
  conversationDays: number;
  fallbackThemes: string[];
  onBack: () => void;
};

function italicLastWord(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.*?)(\s+)(\S+?)([.!?…]*)$/s);
  if (!match || !match[1]) {
    return { before: trimmed, accent: '', after: '' };
  }
  return { before: match[1] + match[2], accent: match[3], after: match[4] };
}

function quoted(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (/^[“"']/.test(trimmed)) return trimmed;
  return `“${trimmed}”`;
}

export default function WeekRecapView({
  weekStart,
  firstName,
  weekDots,
  conversationDays,
  fallbackThemes,
  onBack,
}: WeekRecapViewProps) {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { deepInsightContent, refreshExploreInsights } = useTabScreenContext();
  const { loading, status, insight, generateDeepInsight, hydrateInsight, error } =
    useDeepInsight();

  const weekStartDate = parseDateString(weekStart);
  const weekEndDate = getWeekEndBrasilia(weekStartDate);
  const rangeLabel = formatWeekRangeLong(weekStartDate, weekEndDate);

  useEffect(() => {
    if (deepInsightContent) {
      hydrateInsight(deepInsightContent, weekStart);
      return;
    }
    if (status !== 'idle') return;
    void generateDeepInsight(weekStart).then((generated) => {
      if (generated) {
        void refreshExploreInsights({ cacheOnly: true });
      }
    });
  }, [
    deepInsightContent,
    generateDeepInsight,
    hydrateInsight,
    refreshExploreInsights,
    status,
    weekStart,
  ]);

  const themes = useMemo(() => {
    const fromInsight = insight?.themes?.map((theme) => theme.trim()).filter(Boolean) ?? [];
    if (fromInsight.length > 0) return fromInsight.slice(0, 3);
    return fallbackThemes.slice(0, 3);
  }, [fallbackThemes, insight?.themes]);

  const pattern = insight?.what_i_noticed?.content?.trim() || insight?.headline?.trim() || '';
  const patternParts = pattern ? italicLastWord(pattern) : null;
  const quote = quoted(insight?.quote?.trim() || insight?.reflection?.content?.trim() || '');
  const nextStep = insight?.next_steps?.content?.trim() || '';

  const shareRecap = useCallback(async () => {
    const title = `Sua semana, ${firstName}`;
    const body = [pattern, quote, nextStep].filter(Boolean).join('\n\n');
    await Share.share({ message: body ? `${title}\n\n${body}` : title });
  }, [firstName, nextStep, pattern, quote]);

  const talkAboutWeek = useCallback(() => {
    if (!insight) return;
    onBack();
    requestAnimationFrame(() => {
      openDeepInsightChat(navigation, insight, 'text');
    });
  }, [insight, navigation, onBack]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Image
        source={assets.historyRecapMist}
        pointerEvents="none"
        style={styles.mist}
        resizeMode="cover"
      />

      <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={onBack} />
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.text }]}>
          Resumo da semana
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartilhar resumo da semana"
          onPress={() => void shareRecap()}
          style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}
        >
          <HistoryShareIcon color={colors.text} />
        </Pressable>
      </View>

      {loading || (!insight && status === 'idle') ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !insight ? (
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {error || 'Ainda não geramos esse resumo.'}
          </Text>
          <Text style={[styles.errorBody, { color: colors.text2 }]}>
            Continue conversando com o Bud nesta semana.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 12,
              paddingBottom: insets.bottom + 90,
            }}
          >
            <Text style={[styles.kicker, { color: colors.text3 }]}>{rangeLabel}</Text>
            <View style={{ paddingTop: 10 }}>
              <AccentTitle
                before="Sua semana, "
                accent={firstName}
                size={34}
                lineHeight={40}
              />
            </View>
            <Text style={[styles.lead, { color: colors.text2 }]}>
              Você conversou com o Bud em {conversationDays} dos 7 dias.
            </Text>

            <View style={styles.dotsRow}>
              {weekDots.map((dot, index) => (
                <View key={`${dot.label}-${index}`} style={styles.dotColLarge}>
                  <View
                    style={[
                      styles.dotLarge,
                      {
                        backgroundColor: dot.active ? colors.accent : 'transparent',
                        borderColor: dot.active ? colors.accent : colors.line,
                      },
                    ]}
                  />
                  <Text style={[styles.dotLabel, { color: colors.text3 }]}>{dot.label}</Text>
                </View>
              ))}
            </View>

            {themes.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.kicker, { color: colors.text3 }]}>O que mais apareceu</Text>
                <View style={styles.themeRow}>
                  {themes.map((theme) => (
                    <View
                      key={theme}
                      style={[styles.themeChip, { backgroundColor: colors.surface2 }]}
                    >
                      <Text style={[styles.themeChipLabel, { color: colors.text }]}>{theme}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {patternParts ? (
              <View style={styles.section}>
                <Text style={[styles.kicker, { color: colors.text3 }]}>Um padrão que eu notei</Text>
                <Text style={[styles.pattern, { color: colors.text }]}>
                  {patternParts.before}
                  <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>
                    {patternParts.accent}
                  </Text>
                  {patternParts.after}
                </Text>
              </View>
            ) : null}

            {quote ? (
              <View style={styles.section}>
                <Text style={[styles.kicker, { color: colors.text3 }]}>Uma frase sua</Text>
                <View style={[styles.quoteBar, { borderLeftColor: colors.accent }]}>
                  <Text style={[styles.quote, { color: colors.text2 }]}>{quote}</Text>
                </View>
              </View>
            ) : null}

            {nextStep ? (
              <View style={styles.section}>
                <Text style={[styles.kicker, { color: colors.text3 }]}>
                  Pra levar pra próxima semana
                </Text>
                <Text style={[styles.next, { color: colors.text }]}>{nextStep}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.ctaWrap,
              { paddingBottom: insets.bottom + 16, backgroundColor: 'transparent' },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Conversar sobre a semana"
              onPress={talkAboutWeek}
              style={[styles.cta, { backgroundColor: colors.btn }]}
            >
              <HistoryMessageIcon color={colors.onBtn} />
              <Text style={[styles.ctaLabel, { color: colors.onBtn }]}>
                Conversar sobre a semana
              </Text>
            </Pressable>
          </View>
        </>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mist: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  header: {
    height: 56,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  kicker: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
    lineHeight: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
  },
  dotColLarge: {
    width: 34,
    alignItems: 'center',
  },
  dotLarge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  dotLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    lineHeight: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    marginTop: 40,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  themeChip: {
    height: 34,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  themeChipLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    lineHeight: 14,
  },
  pattern: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginTop: 10,
  },
  quoteBar: {
    marginTop: 10,
    borderLeftWidth: 2,
    paddingLeft: 14,
  },
  quote: {
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
  },
  next: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  cta: {
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 17,
  },
});
