import { Image, ImageBackground, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import {
  formatDailyLetterPlain,
  LETTER_NOTICED_HEADING,
  LETTER_SIGNOFF,
  LETTER_TAKEAWAY_HEADING,
  parseDailyLetterBody,
} from '@/utils/dailyLetter';
import { navigateToChatTab } from '@/utils/navigateToChat';

export default function LetterOpenScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { letter } = useDailyLetter();
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

  return (
    <ImageBackground
      source={assets.envelopePaper}
      style={{ flex: 1, backgroundColor: colors.bg }}
      imageStyle={{ opacity: 0.28 }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <BudIconButton icon={X} accessibilityLabel="Fechar" onPress={() => navigation.navigate('Home')} />
        </View>
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
            Carta de hoje
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
              navigateToChatTab(navigation, {
                chatInsight: {
                  insightType: 'yesterday_journey',
                  title,
                  contextSummary: opening,
                  internalContext: shareText,
                  cardDescription: opening,
                  backgroundType: 'yesterday',
                },
              })
            }
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
