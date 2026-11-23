import { Image, ImageBackground, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { BudButton, BudIconButton, BudSkeletonBone, BudSkeletonPulse } from '@/components/v3';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { useStoredDailyLetter } from '@/hooks/useStoredDailyLetter';
import { useUserPlan } from '@/hooks/useUserPlan';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';
import { buildLetterChatInsight } from '@/utils/buildLetterChatInsight';
import {
  formatDailyLetterPlain,
  LETTER_NOTICED_HEADING,
  LETTER_SIGNOFF,
  LETTER_TAKEAWAY_HEADING,
  parseDailyLetterBody,
} from '@/utils/dailyLetter';
import { getTodayInBrasilia } from '@/utils/dateUtils';
import { openContextualChatOrPaywall } from '@/utils/openContextualChatOrPaywall';

export default function LetterOpenScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { requiresPremiumForContext } = useUserPlan();
  const route = useRoute<RouteProp<MainTabParamList, 'LetterOpen'>>();
  const letterDateParam = route.params?.letterDate;
  const today = getTodayInBrasilia();
  const fromHistory = Boolean(letterDateParam);
  const letterDate = letterDateParam ?? today;

  const todayLetter = useDailyLetter();
  const storedLetter = useStoredDailyLetter(fromHistory ? letterDate : undefined);

  const letter = fromHistory ? storedLetter.letter : todayLetter.letter;
  const loading = fromHistory ? storedLetter.loading : todayLetter.loading;
  const { g } = useGenderedCopy();
  const title = g(letter?.title ?? 'Você não precisa resolver tudo hoje');
  const sections = parseDailyLetterBody(letter?.body);
  const opening = g(sections.opening);
  const noticed = g(sections.noticed);
  const takeaway = g(sections.takeaway);
  const shareText = formatDailyLetterPlain(title, { opening, noticed, takeaway });
  const words = title.trim().split(' ');
  const last = words.pop() ?? title;
  const lead = words.join(' ');
  const eyebrow = letterDate === today ? 'Carta de hoje' : 'Carta do dia';

  const handleClose = () => {
    if (fromHistory && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Home');
  };

  return (
    <ImageBackground
      source={assets.envelopePaper}
      style={{ flex: 1, backgroundColor: colors.bg }}
      imageStyle={{ opacity: 0.28 }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={handleClose} />
        </View>
        {loading && !letter ? (
          <BudSkeletonPulse
            accessibilityLabel="Preparando carta"
            style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24, gap: 16 }}
          >
            <BudSkeletonBone width={120} height={12} borderRadius={6} colors={colors} />
            <BudSkeletonBone width="88%" height={36} borderRadius={12} colors={colors} />
            <BudSkeletonBone width="72%" height={36} borderRadius={12} colors={colors} />
            <View style={{ marginTop: 12, gap: 10 }}>
              <BudSkeletonBone width="100%" height={14} borderRadius={7} tone="line" colors={colors} />
              <BudSkeletonBone width="100%" height={14} borderRadius={7} tone="line" colors={colors} />
              <BudSkeletonBone width="92%" height={14} borderRadius={7} tone="line" colors={colors} />
              <BudSkeletonBone width="78%" height={14} borderRadius={7} tone="line" colors={colors} />
            </View>
            <View style={{ marginTop: 20, gap: 10 }}>
              <BudSkeletonBone width="100%" height={14} borderRadius={7} tone="line" colors={colors} />
              <BudSkeletonBone width="86%" height={14} borderRadius={7} tone="line" colors={colors} />
              <BudSkeletonBone width="64%" height={14} borderRadius={7} tone="line" colors={colors} />
            </View>
          </BudSkeletonPulse>
        ) : !letter ? (
          <View
            style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 16 }}
            accessibilityLabel="Carta indisponível"
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.4,
                color: colors.text,
              }}
            >
              Essa carta não está disponível
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.text2 }}>
              Não encontramos o conteúdo dessa carta. Volte ao histórico e tente outro dia.
            </Text>
            <BudButton label="Voltar" onPress={handleClose} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 40 }}>
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 11.5,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: colors.text3,
                marginTop: 24,
              }}
            >
              {eyebrow}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 34,
                lineHeight: 40,
                letterSpacing: -0.4,
                color: colors.text,
                marginTop: 16,
              }}
            >
              {lead ? `${lead} ` : ''}
              <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>{last}</Text>
            </Text>
            {opening ? (
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 16,
                  lineHeight: 25,
                  color: colors.text2,
                  marginTop: 22,
                }}
              >
                {opening}
              </Text>
            ) : null}
            {noticed ? (
              <>
                <View style={{ marginTop: 28, paddingBottom: 16, overflow: 'visible' }}>
                  <Image
                    pointerEvents="none"
                    source={assets.letterUnderline}
                    style={{ position: 'absolute', left: -6, top: 16, width: 190, height: 26 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 20,
                      lineHeight: 26,
                      letterSpacing: -0.4,
                      color: colors.text,
                    }}
                  >
                    {LETTER_NOTICED_HEADING}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 16,
                    lineHeight: 25,
                    color: colors.text2,
                    marginTop: 16,
                  }}
                >
                  {noticed}
                </Text>
              </>
            ) : null}
            {takeaway ? (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 20,
                    lineHeight: 26,
                    letterSpacing: -0.4,
                    color: colors.text,
                    marginTop: 28,
                  }}
                >
                  {LETTER_TAKEAWAY_HEADING}
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
                  {takeaway}
                </Text>
              </>
            ) : null}
            <Text
              style={{
                fontFamily: fonts.displayItalic,
                fontSize: 20,
                letterSpacing: -0.4,
                color: colors.text2,
                marginTop: 26,
              }}
            >
              {LETTER_SIGNOFF}
            </Text>
            <BudButton
              label="Conversar sobre isso"
              onPress={() =>
                openContextualChatOrPaywall(
                  navigation,
                  {
                    chatInsight: buildLetterChatInsight({
                      letterId: letter?.id,
                      title,
                      shareText,
                      opening,
                    }),
                  },
                  { requiresPremiumForContext },
                )
              }
              style={{ marginTop: 32 }}
            />
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
}
