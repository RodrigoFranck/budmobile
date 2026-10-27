import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { CrisisResources } from '@/components/CrisisResources';
import { BudIconButton } from '@/components/v3';
import { fonts, useV3Colors } from '@/theme';

export default function CrisisResourcesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useV3Colors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <BudIconButton
          icon={ChevronLeft}
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 0) + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 16 }}>
          Recursos de crise
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.text2, marginTop: 8 }}>
          Se agora está pesado demais, peça ajuda a alguém de verdade.
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            marginTop: 24,
          }}
        >
          <CrisisResources
            textColor={colors.text}
            subtextColor={colors.text2}
            buttonBackground={colors.surface2}
            buttonTextColor={colors.text}
          />
        </View>
      </ScrollView>
    </View>
  );
}
