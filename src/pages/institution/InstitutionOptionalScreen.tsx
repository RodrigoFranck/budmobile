import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { SCREENINGS, type ScreeningId } from '@/pages/institution/screeningCatalog';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

const BATTERY_A: ScreeningId[] = ['assq', 'sleep', 'food', 'attention', 'energy'];
const BATTERY_B: ScreeningId[] = ['edeqs', 'ptsd', 'grief', 'rituals', 'perceptions'];
const BATTERY_C: ScreeningId[] = ['audit', 'cage', 'substance', 'gambling'];

function Section({
  title,
  ids,
  onOpen,
}: {
  title: string;
  ids: ScreeningId[];
  onOpen: (id: ScreeningId) => void;
}) {
  const colors = useV3Colors();
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.text3, letterSpacing: 1 }}>
        {title}
      </Text>
      {ids.map((id) => (
        <Pressable
          key={id}
          onPress={() => onOpen(id)}
          accessibilityRole="button"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            padding: 18,
            marginTop: 12,
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
    </View>
  );
}

export default function InstitutionOptionalScreen() {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();

  const onOpen = (instrument: ScreeningId) => {
    if (instrument === 'sleep' || instrument === 'assq') {
      navigation.navigate('SleepCheckIn');
      return;
    }
    navigation.navigate('Screening', { instrument });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 16 }}>
          Se fizer sentido agora
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 8 }}>
          Rastreios opcionais. Nada de pontuação aparece na tela.
        </Text>
        <Section title="Bateria A" ids={BATTERY_A} onOpen={onOpen} />
        <Section title="Bateria B" ids={BATTERY_B} onOpen={onOpen} />
        <Section title="Bateria C" ids={BATTERY_C} onOpen={onOpen} />
      </ScrollView>
    </View>
  );
}
