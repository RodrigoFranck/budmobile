import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { BudButton } from '@/components/v3';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { PREF_EDIT_SPECS, type PrefEditField } from '@/pages/menu/menuCatalog';
import {
  AccentTitle,
  MenuHeader,
  PrefTextField,
  ScreenScaffold,
  SelectOption,
} from '@/pages/menu/menuUi';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabParamList } from '@/types/navigation';
import { Text } from 'react-native';

type PrefEditRoute = RouteProp<MainTabParamList, 'PrefEdit'>;

export default function PrefEditScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation();
  const route = useRoute<PrefEditRoute>();
  const field = route.params.field as PrefEditField;
  const spec = PREF_EDIT_SPECS[field];
  const { fieldValue, saveField } = useV3Preferences();
  const current = fieldValue(field);
  const [text, setText] = useState(typeof current === 'string' ? current : '');
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(current) ? current : current ? [current] : [],
  );
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    if (spec.kind === 'text') return text.trim().length > 0;
    if (spec.kind === 'single') return selected.length === 1;
    return true;
  }, [selected.length, spec.kind, text]);

  const toggle = (option: string) => {
    if (spec.kind === 'single') {
      setSelected([option]);
      return;
    }
    setSelected((currentSelected) => {
      if (currentSelected.includes(option)) {
        return currentSelected.filter((item) => item !== option);
      }
      if (spec.maxSelect && currentSelected.length >= spec.maxSelect) {
        return currentSelected;
      }
      return [...currentSelected, option];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (spec.kind === 'text') {
        await saveField(field, text.trim());
      } else if (spec.kind === 'single') {
        await saveField(field, selected[0] ?? '');
      } else {
        await saveField(field, selected);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold
      bottom={
        <BudButton
          label="Salvar"
          onPress={() => void save()}
          loading={saving}
          disabled={!canSave}
          variant={canSave ? 'primary' : 'disabled'}
        />
      }
    >
      <MenuHeader onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 8, marginTop: 38 }}>
        <AccentTitle before={spec.titleBefore} accent={spec.titleAccent} after={spec.titleAfter} />
        {spec.subtitle ? (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 17,
              lineHeight: 26,
              color: colors.text2,
              marginTop: 16,
            }}
          >
            {spec.subtitle}
          </Text>
        ) : null}
      </View>

      {spec.kind === 'text' ? (
        <View style={{ marginTop: 36, paddingHorizontal: 4 }}>
          <PrefTextField value={text} onChangeText={setText} placeholder={spec.placeholder} />
        </View>
      ) : (
        <View style={{ marginTop: 36, gap: 10, paddingHorizontal: 4 }}>
          {(spec.options ?? []).map((option) => (
            <SelectOption
              key={option}
              label={option}
              selected={selected.includes(option)}
              onPress={() => toggle(option)}
              multi={spec.kind === 'multi'}
            />
          ))}
        </View>
      )}
    </ScreenScaffold>
  );
}
