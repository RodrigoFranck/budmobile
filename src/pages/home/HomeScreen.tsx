import { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, MessageSquare } from 'lucide-react-native';

import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { BudIconButton } from '@/components/v3';
import { useTabScreenContext, useTabScreenLoading } from '@/contexts/TabScreenContext';
import { useDailyLetter } from '@/hooks/useDailyLetter';
import { useScreeningCadence } from '@/hooks/useScreeningCadence';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { navigateToChatTab } from '@/utils/navigateToChat';

function greetingForHour(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const tabLoading = useTabScreenLoading('Home');
  const { profile, yesterdayInsight, conversations } = useTabScreenContext();
  const { letter } = useDailyLetter();
  const screening = useScreeningCadence({ autoNavigate: true });
  const firstName = profile?.name?.split(' ')[0] ?? 'você';

  const recaps = useMemo(() => {
    const items: { label: string; quote: string; body: string }[] = [];
    if (yesterdayInsight?.description) {
      items.push({
        label: 'Ontem',
        quote: yesterdayInsight.title || 'O que ficou de ontem',
        body: yesterdayInsight.description,
      });
    }
    const older = conversations.find((conversation) => conversation.title);
    if (older?.title && items.length < 2) {
      items.push({
        label: 'Antes',
        quote: older.title,
        body: 'Quer continuar essa conversa de onde parou?',
      });
    }
    return items.slice(0, 2);
  }, [conversations, yesterdayInsight]);

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <BudIconButton
            icon={Menu}
            accessibilityLabel="Menu"
            onPress={() => navigation.navigate('Menu')}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 34,
              lineHeight: 40,
              color: colors.text,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            {greetingForHour()}, {firstName}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              color: colors.text3,
              textAlign: 'center',
              marginTop: 10,
              letterSpacing: 0.4,
            }}
          >
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {letter?.opened_at ? (
            <Pressable
              onPress={() => navigation.navigate('LetterOpen')}
              accessibilityRole="button"
              accessibilityLabel="Ler carta de hoje"
              style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: 28 }}
            >
              <Image source={assets.envelopeOpen} style={{ width: 220, height: 140 }} resizeMode="contain" />
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  color: colors.text,
                  textAlign: 'center',
                  marginTop: 12,
                }}
              >
                {letter.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11.5,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: colors.text3,
                  marginTop: 12,
                }}
              >
                Carta de hoje
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => navigation.navigate('Letter')}
              accessibilityRole="button"
              accessibilityLabel="Abrir carta de hoje"
              style={{ alignItems: 'center', marginTop: 28 }}
            >
              <Image source={assets.envelopeClosed} style={{ width: 280, height: 188 }} resizeMode="contain" />
              <Image
                source={assets.waxSeal}
                style={{ width: 72, height: 72, marginTop: -52 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontFamily: fonts.sansSemi,
                  fontSize: 11.5,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: colors.text3,
                  marginTop: 16,
                }}
              >
                Toque para abrir a carta de hoje
              </Text>
            </Pressable>
          )}

          {screening.due ? (
            <Pressable
              onPress={() => navigation.navigate('Institution', { forced: true })}
              accessibilityRole="button"
              style={{
                marginHorizontal: 20,
                marginTop: 24,
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
              }}
            >
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.text3 }}>
                SUA INSTITUIÇÃO
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text, marginTop: 8 }}>
                Pesquisa de saúde
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.text2, marginTop: 8 }}>
                Pedida no primeiro acesso e a cada três meses. As pontuações ficam só no servidor.
              </Text>
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, color: colors.accent, marginTop: 14 }}>
                Responder agora
              </Text>
            </Pressable>
          ) : null}

          <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.text3 }}>
                Para começar
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.text3 }}>
                {recaps.length} de 10
              </Text>
            </View>

            {recaps.map((item) => (
              <Pressable
                key={item.quote}
                onPress={() =>
                  navigateToChatTab(navigation, {
                    chatInsight: {
                      insightType: 'yesterday_journey',
                      title: item.quote,
                      contextSummary: item.body,
                      internalContext: item.body,
                      cardDescription: item.body,
                      backgroundType: 'yesterday',
                    },
                  })
                }
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 20,
                  marginTop: 14,
                }}
              >
                <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.text3 }}>
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 18,
                    color: colors.text,
                    marginTop: 8,
                  }}
                >
                  “{item.quote}”
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    lineHeight: 22,
                    color: colors.text2,
                    marginTop: 10,
                  }}
                  numberOfLines={4}
                >
                  {item.body}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sansSemi,
                    fontSize: 15,
                    color: colors.accent,
                    marginTop: 16,
                  }}
                >
                  Conversar sobre isso
                </Text>
              </Pressable>
            ))}
          </View>
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
            paddingHorizontal: 20,
            borderRadius: 28,
            backgroundColor: colors.surface2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <MessageSquare color={colors.text} size={22} />
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.text }}>Chat</Text>
        </Pressable>
      </View>
    </ScreenLoadingGate>
  );
}
