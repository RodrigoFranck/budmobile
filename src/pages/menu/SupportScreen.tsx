import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { BudChip } from '@/components/v3';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { APP_VERSION, SUPPORT_TOPICS, type SupportTopic } from '@/pages/menu/menuCatalog';
import { AccentTitle, BudButton, MenuHeader, ScreenScaffold, SectionLabel } from '@/pages/menu/menuUi';
import { sendSupportEmail } from '@/services/sendSupportEmail';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';
import { SUPPORT_MESSAGE_MAX_LENGTH } from '@/utils/supportEmail';

export default function SupportScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { showAlert } = useAppAlert();
  const { user } = useAuth();
  const { data: profile } = useAppProfileQuery();
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const canSend = Boolean(topic && body.trim());

  const send = async () => {
    if (!topic || !body.trim() || sending) return;
    setSending(true);
    try {
      await sendSupportEmail({
        message: body,
        topic,
        replyTo,
        name: profile?.name,
        appVersion: APP_VERSION,
      });
      navigation.navigate('SupportSent');
    } catch (error) {
      showAlert({
        title: 'Não foi possível enviar',
        message: error instanceof Error ? error.message : 'Tente novamente.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenScaffold
      padded={false}
      bottom={
        <BudButton
          label="Enviar"
          onPress={() => void send()}
          loading={sending}
          disabled={!canSend}
          variant={canSend ? 'primary' : 'disabled'}
        />
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        <MenuHeader title="Suporte e feedback" onBack={() => navigation.goBack()} />
      </View>
      <View style={{ paddingHorizontal: 28, marginTop: 12 }}>
        <AccentTitle before="Fale com a " accent="gente" />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 17,
            lineHeight: 26,
            color: colors.text2,
            marginTop: 16,
          }}
        >
          Conte um problema, tire uma dúvida ou mande uma ideia. Chega direto no nosso time.
        </Text>
      </View>
      <SectionLabel label="Sobre o que é" style={{ marginTop: 48, marginLeft: 30 }} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 24,
          marginTop: 12,
        }}
      >
        {SUPPORT_TOPICS.map((item) => (
          <BudChip
            key={item}
            label={item}
            selected={topic === item}
            selectedTone="accent"
            onPress={() => setTopic(item)}
          />
        ))}
      </View>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Conte o que aconteceu"
        placeholderTextColor={colors.text3}
        multiline
        maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
        textAlignVertical="top"
        style={{
          marginTop: 20,
          marginHorizontal: 24,
          height: 170,
          borderRadius: 22,
          backgroundColor: colors.surface,
          paddingHorizontal: 20,
          paddingVertical: 18,
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 24,
          color: colors.text,
        }}
      />
      <SectionLabel label="Responder para" style={{ marginTop: 26, marginLeft: 30 }} />
      <TextInput
        value={replyTo}
        onChangeText={setReplyTo}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          marginTop: 12,
          marginHorizontal: 24,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.surface2,
          paddingHorizontal: 22,
          fontFamily: fonts.sans,
          fontSize: 16,
          color: colors.text,
        }}
      />
    </ScreenScaffold>
  );
}
