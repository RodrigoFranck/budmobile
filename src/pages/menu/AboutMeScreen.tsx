import { useNavigation } from '@react-navigation/native';

import { useV3Preferences } from '@/hooks/useV3Preferences';
import { ABOUT_ME_ROWS, formatPrefValue } from '@/pages/menu/menuCatalog';
import { AccentTitle, MenuHeader, PrefGroup, PrefRow, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { Text } from 'react-native';

export default function AboutMeScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { fieldValue, values } = useV3Preferences();

  return (
    <ScreenScaffold>
      <MenuHeader onBack={() => navigation.goBack()} />
      <AccentTitle before="Sobre " accent="você" />
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
        É o que o Bud sabe de você. Toque para mudar quando quiser.
      </Text>
      <PrefGroup style={{ marginTop: 22 }}>
        {ABOUT_ME_ROWS.map((row, index) => (
          <PrefRow
            key={row.field}
            label={row.label}
            value={formatPrefValue(fieldValue(row.field), values.gender)}
            last={index === ABOUT_ME_ROWS.length - 1}
            onPress={() => navigation.navigate('PrefEdit', { field: row.field })}
          />
        ))}
      </PrefGroup>
    </ScreenScaffold>
  );
}
