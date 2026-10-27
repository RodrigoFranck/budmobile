import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Volume2 } from 'lucide-react-native';

import { BudButton } from '@/components/v3';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { AccentTitle, MenuHeader, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Colors, voiceOptions } from '@/theme';

export default function VoiceSelectScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation();
  const { values, persist } = useV3Preferences();
  const initial = Math.max(
    0,
    voiceOptions.findIndex((option) => option.id === values.voice),
  );
  const [index, setIndex] = useState(initial);
  const [saving, setSaving] = useState(false);
  const voice = voiceOptions[index];

  return (
    <ScreenScaffold
      padded={false}
      bottom={
        <BudButton
          label="Salvar"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await persist({ selectedVoice: voice.id });
              navigation.goBack();
            } finally {
              setSaving(false);
            }
          }}
        />
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        <MenuHeader onBack={() => navigation.goBack()} />
      </View>
      <View style={{ paddingHorizontal: 28, marginTop: 36 }}>
        <AccentTitle before="Qual voz você " accent="prefere" after="?" />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 17,
            lineHeight: 26,
            color: colors.text2,
            marginTop: 16,
          }}
        >
          Deslize para ouvir as outras vozes.
        </Text>
      </View>

      <View style={{ marginTop: 88, flexDirection: 'row', paddingHorizontal: 28 }}>
        <Pressable
          onPress={() => setIndex((current) => (current + 1) % voiceOptions.length)}
          accessibilityRole="button"
          accessibilityLabel="Próxima voz"
          style={{
            width: 200,
            height: 200,
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: colors.surface,
          }}
        >
          <Image source={voice.image} style={{ width: 200, height: 200 }} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 22, paddingTop: 8 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.4,
              color: colors.text,
            }}
          >
            {voice.label}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 16,
              lineHeight: 25,
              color: colors.text2,
              marginTop: 8,
            }}
          >
            {voice.bio}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Volume2 color={colors.accent} size={22} />
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 14, color: colors.accent }}>Ouvir</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 80 }}>
        {voiceOptions.map((option, optionIndex) => (
          <Pressable
            key={option.id}
            onPress={() => setIndex(optionIndex)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            style={{
              height: 9,
              width: optionIndex === index ? 28 : 9,
              borderRadius: 5,
              backgroundColor: optionIndex === index ? colors.text : colors.text3,
            }}
          />
        ))}
      </View>
    </ScreenScaffold>
  );
}
