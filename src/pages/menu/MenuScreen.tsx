import { useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  Clock,
  Heart,
  Info,
  Leaf,
  LogOut,
  MessageSquare,
  Copy,
  Share2,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { BudButton } from '@/components/v3';
import { BUD_SHARE_DISPLAY } from '@/constants/preferences';
import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { useScreeningCadence } from '@/hooks/useScreeningCadence';
import { copyBudLink, shareBud } from '@/pages/menu/shareBud';
import { AccentTitle, BottomSheet } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';


type MenuDest = keyof Pick<
  MainTabParamList,
  'Home' | 'History' | 'Activities' | 'InstitutionOptional' | 'Preferences' | 'Account' | 'AboutBud' | 'Support'
>;

const NAV_ITEMS: { label: string; icon: LucideIcon; dest: MenuDest; badge?: boolean }[] = [
  { label: 'Início', icon: Leaf, dest: 'Home' },
  { label: 'Histórico', icon: Clock, dest: 'History' },
  { label: 'Atividades', icon: Sparkles, dest: 'Activities' },
  { label: 'Pesquisa de saúde', icon: Activity, dest: 'InstitutionOptional' },
  { label: 'Preferências', icon: SlidersHorizontal, dest: 'Preferences' },
  { label: 'Conta e dados', icon: User, dest: 'Account' },
  { label: 'Sobre o Bud', icon: Info, dest: 'AboutBud' },
  { label: 'Suporte e feedback', icon: MessageSquare, dest: 'Support' },
];

export default function MenuScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { signOut, user } = useAuth();
  const { profile } = useTabScreenContext();
  const screening = useScreeningCadence();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const firstName = profile?.name?.split(' ')[0] ?? '';

  const go = (dest: MenuDest) => {
    if (dest === 'Home') {
      navigation.goBack();
      return;
    }
    navigation.navigate(dest);
  };

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityLabel="Fechar menu"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: colors.scrim,
          opacity: 0.55,
        }}
      />
      <View
        style={{
          width: 340,
          flex: 1,
          backgroundColor: colors.surface,
          paddingTop: insets.top + 50,
          paddingHorizontal: 30,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 40,
            lineHeight: 40,
            letterSpacing: -0.4,
            color: colors.text,
          }}
        >
          Bud
          <Text style={{ color: colors.accent }}>.</Text>
        </Text>
        {firstName ? (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 15,
              color: colors.text3,
              marginTop: 10,
            }}
          >
            {firstName}
          </Text>
        ) : null}

        <View style={{ marginTop: 26, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => go(item.dest)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={{ height: 54, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <item.icon color={colors.text} size={22} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 17, lineHeight: 17, color: colors.text }}>
                {item.label}
              </Text>
              {item.dest === 'InstitutionOptional' && screening.due ? (
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                    marginLeft: 4,
                  }}
                />
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
          <Pressable
            onPress={() => setShareOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Indicar o Bud"
            style={{ height: 50, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Share2 color={colors.text} size={22} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 16, color: colors.text }}>
              Indicar o Bud
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL('https://www.cvv.org.br')}
            accessibilityRole="link"
            accessibilityLabel="Preciso de ajuda agora"
            style={{ height: 50, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Heart color={colors.accent} size={22} />
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 16,
                lineHeight: 16,
                color: colors.accent,
              }}
            >
              Preciso de ajuda agora
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSignOutOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair"
            style={{ height: 50, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <LogOut color={colors.text} size={22} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 16, color: colors.text }}>
              Sair
            </Text>
          </Pressable>
        </View>
      </View>

      <BottomSheet visible={signOutOpen} onClose={() => setSignOutOpen(false)} height={300}>
        <View style={{ paddingTop: 26 }}>
          <AccentTitle before="Sair da sua " accent="conta" after="?" size={26} lineHeight={32} />
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              marginTop: 12,
            }}
          >
            Suas conversas ficam guardadas. Para voltar, é só entrar de novo
            {user?.email ? ` com ${user.email}` : ''}.
          </Text>
          <BudButton
            label="Sair"
            onPress={() => {
              setSignOutOpen(false);
              void signOut();
            }}
            style={{ marginTop: 30 }}
          />
          <BudButton
            label="Cancelar"
            variant="soft"
            onPress={() => setSignOutOpen(false)}
            style={{ marginTop: 12 }}
          />
        </View>
      </BottomSheet>

      <BottomSheet visible={shareOpen} onClose={() => setShareOpen(false)} height={340}>
        <View style={{ paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ paddingTop: 16 }}>
                <AccentTitle before="Indique o " accent="Bud" size={26} lineHeight={32} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 16,
                  lineHeight: 25,
                  color: colors.text2,
                  marginTop: 12,
                  maxWidth: 300,
                }}
              >
                Conhece alguém que ia gostar de ter com quem conversar? Mande o link.
              </Text>
            </View>
            <Image source={assets.shareHands} style={{ width: 100, height: 100 }} resizeMode="contain" />
          </View>
          <Pressable
            onPress={() => void copyBudLink()}
            accessibilityRole="button"
            accessibilityLabel="Copiar link"
            style={{
              marginTop: 24,
              height: 56,
              borderRadius: 18,
              backgroundColor: colors.surface2,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.text }}>
              {BUD_SHARE_DISPLAY}
            </Text>
            <Copy color={colors.text} size={22} />
          </Pressable>
          <Pressable
            onPress={() => void shareBud()}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar"
            style={{
              marginTop: 14,
              height: 58,
              borderRadius: 29,
              backgroundColor: colors.btn,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Share2 color={colors.onBtn} size={22} />
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 17, color: colors.onBtn }}>
              Compartilhar
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
