import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { BudButton, VoicePicker, type VoicePickerHandle } from '@/components/v3';
import { appAlert } from '@/contexts/AppAlertContext';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { AccentTitle, MenuHeader, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Colors, voiceFromValue, voiceOptions } from '@/theme';
import { restoreVoiceRecordingAudioMode } from '@/voice/voiceAudioSession';

export default function VoiceSelectScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation();
  const { values, persist } = useV3Preferences();
  const pickerRef = useRef<VoicePickerHandle>(null);
  const resolvedVoice = voiceFromValue(values.voice);
  const initial = Math.max(
    0,
    voiceOptions.findIndex((option) => option.id === resolvedVoice),
  );
  const [index, setIndex] = useState(initial);
  const [saving, setSaving] = useState(false);
  const voice = voiceOptions[index] ?? voiceOptions[0];

  const prepareLeave = async () => {
    await pickerRef.current?.stopDemo();
    await restoreVoiceRecordingAudioMode();
  };

  return (
    <ScreenScaffold
      padded={false}
      scroll={false}
      bottom={
        <BudButton
          label="Salvar"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await prepareLeave();
              await persist({ selectedVoice: voice.id });
              navigation.goBack();
            } catch (error) {
              appAlert({
                title: 'Não deu para salvar',
                message: error instanceof Error ? error.message : 'Tente de novo em instantes.',
              });
            } finally {
              setSaving(false);
            }
          }}
        />
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        <MenuHeader
          onBack={() => {
            void prepareLeave().finally(() => navigation.goBack());
          }}
        />
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

      <View style={{ marginTop: 88 }}>
        <VoicePicker ref={pickerRef} index={index} onIndexChange={setIndex} />
      </View>
    </ScreenScaffold>
  );
}
