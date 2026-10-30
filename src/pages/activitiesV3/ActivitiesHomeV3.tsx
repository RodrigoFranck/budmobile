import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { BudIconButton } from '@/components/v3';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Asset, useV3Colors } from '@/theme';
import type { ActivityId } from '@/pages/activitiesV3/activityFlows';
import type { MainTabNavigationProp } from '@/types/navigation';

const H_PADDING = 20;
const LEDE_PADDING = 24;
const GRID_GAP = 20;
const COVER_RADIUS = 24;

const cards: { id: ActivityId; title: string; subtitle: string; duration: string }[] = [
  {
    id: 'cinco_porques',
    title: 'Cinco Porquês',
    subtitle: 'Chegue à raiz do que está te incomodando',
    duration: '5 min',
  },
  {
    id: 'fiee',
    title: 'FIEE?',
    subtitle: 'Um check-in rápido com você mesma',
    duration: '1 min',
  },
  {
    id: 'mapa_relacoes',
    title: 'Mapa de Relações',
    subtitle: 'Olhe com calma para uma relação importante',
    duration: '5 min',
  },
  {
    id: 'ordenacao_valores',
    title: 'Ordenação de Valores',
    subtitle: 'Descubra o que guia as suas escolhas',
    duration: '4 min',
  },
];

export default function ActivitiesHomeV3() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { g } = useGenderedCopy();
  const { width } = useWindowDimensions();
  const coverSize = (width - H_PADDING * 2 - GRID_GAP) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <BudIconButton icon={ChevronLeft} accessibilityLabel="Voltar" onPress={() => navigation.goBack()} />
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.text }]}>
          Atividades
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Text style={[styles.lede, { color: colors.text2 }]}>
          Exercícios curtos para refletir, se acalmar e seguir em frente.
        </Text>

        <View style={styles.grid}>
          {cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => navigation.navigate('ActivityFlow', { activityId: card.id })}
              accessibilityRole="button"
              accessibilityLabel={`${card.title}. ${g(card.subtitle)}. ${card.duration}`}
              style={{ width: coverSize }}
            >
              <Image
                source={assets.activityCards[card.id]}
                style={{ width: coverSize, height: coverSize, borderRadius: COVER_RADIUS }}
                resizeMode="cover"
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.text2 }]}>{g(card.subtitle)}</Text>
              <Text style={[styles.cardDuration, { color: colors.text3 }]}>{card.duration}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: H_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 18,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  lede: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    paddingHorizontal: LEDE_PADDING,
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: 36,
    marginTop: 16,
    paddingHorizontal: H_PADDING,
  },
  cardTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 18,
    lineHeight: 22,
    paddingTop: 14,
  },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 6,
  },
  cardDuration: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
    lineHeight: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    paddingTop: 10,
  },
});
