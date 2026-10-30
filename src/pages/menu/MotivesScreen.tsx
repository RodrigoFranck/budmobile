import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useV3Preferences } from '@/hooks/useV3Preferences';
import { formatPrefValue, MOTIVE_ROWS } from '@/pages/menu/menuCatalog';
import { AccentTitle, MenuHeader, PrefGroup, PrefRow, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

export default function MotivesScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { fieldValue, values } = useV3Preferences();

  return (
    <ScreenScaffold>
      <MenuHeader onBack={() => navigation.goBack()} />
      <AccentTitle before="O que te trouxe " accent="aqui" />
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text2,
          marginTop: 10,
          paddingHorizontal: 4,
        }}
      >
        Suas respostas do começo. Mudou alguma coisa? Atualize quando quiser.
      </Text>
      <PrefGroup style={{ marginTop: 20 }}>
        {MOTIVE_ROWS.map((row, index) => (
          <PrefRow
            key={row.field}
            label={row.label}
            hint={formatPrefValue(fieldValue(row.field), values.gender)}
            tall
            last={index === MOTIVE_ROWS.length - 1}
            onPress={() => navigation.navigate('PrefEdit', { field: row.field })}
          />
        ))}
      </PrefGroup>
    </ScreenScaffold>
  );
}
