import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudButton, BudIconButton } from '@/components/v3';
import { useScreeningCadence } from '@/hooks/useScreeningCadence';
import { SCREENINGS, type ScreeningId } from '@/pages/institution/screeningCatalog';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';

const PRESCRIBED: ScreeningId[] = ['gad7', 'phq9', 'prescribed_checkin'];

type Route = RouteProp<MainTabParamList, 'Institution'>;

export default function InstitutionHomeScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<Route>();
  const { snooze } = useScreeningCadence({ autoNavigate: false });
  const forced = Boolean(route.params?.forced);

  const goHome = () => {
    snooze();
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={goHome} />
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Image source={assets.gizCoracao} style={{ width: 88, height: 88, marginTop: 8 }} resizeMode="contain" />
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 8 }}>
          Pesquisa de saúde
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 8 }}>
          {forced
            ? 'Pedida no primeiro acesso e a cada três meses. As pontuações ficam só no servidor.'
            : 'Umas perguntas pedidas pela sua instituição. Nada de pontuação aparece aqui.'}
        </Text>

        {PRESCRIBED.map((id) => (
          <Pressable
            key={id}
            onPress={() => navigation.navigate('Screening', { instrument: id })}
            accessibilityRole="button"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              padding: 18,
              marginTop: 14,
            }}
          >
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.text }}>
              {SCREENINGS[id].title}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.text2, marginTop: 4 }}>
              {SCREENINGS[id].intro}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => navigation.navigate('SleepCheckIn')}
          accessibilityRole="button"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 18,
            marginTop: 14,
          }}
        >
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.text }}>Check-in de sono</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.text2, marginTop: 4 }}>
            Como o corpo descansou. Sem nota na tela.
          </Text>
        </Pressable>

        <BudButton label="Depois" variant="soft" onPress={goHome} style={{ marginTop: 28 }} />
        <Pressable
          onPress={() => navigation.navigate('InstitutionOptional')}
          accessibilityRole="button"
          style={{ paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, color: colors.accent }}>
            Outras perguntas, se fizer sentido
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
