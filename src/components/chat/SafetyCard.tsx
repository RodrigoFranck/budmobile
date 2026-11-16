import { useEffect } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTION_EVENTS, logActionEvent } from '@/analytics';
import { useGenderedCopy } from '@/hooks/useGenderedCopy';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

const CVV_CHAT_URL = 'https://www.cvv.org.br';

function accentWordForVoice(voice: 'feminine' | 'masculine' | 'neutral') {
  if (voice === 'feminine') return 'sozinha';
  if (voice === 'masculine') return 'sozinho';
  return 'só';
}

export function SafetyCard() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const { voice } = useGenderedCopy();
  const accentWord = accentWordForVoice(voice);

  useEffect(() => {
    void logActionEvent(ACTION_EVENTS.HELP_OPENED, { source: 'chat' });
  }, []);

  const callNumber = (phone: string, channel: string) => {
    void logActionEvent(ACTION_EVENTS.HELP_CALL, { channel });
    void Linking.openURL(`tel:${phone}`);
  };

  const openCvvChat = () => {
    void logActionEvent(ACTION_EVENTS.HELP_CALL, { channel: 'cvv_chat' });
    void Linking.openURL(CVV_CHAT_URL);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Image
        source={assets.riskHands}
        style={styles.hands}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.title, { color: colors.text }]}>
        Você não está{' '}
        <Text style={[styles.titleAccent, { color: colors.accent }]}>{accentWord}</Text>
      </Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Se você está pensando em se machucar ou em tirar a própria vida, ligue agora para o CVV. A
        ligação é gratuita, 24 horas por dia, e sigilosa.
      </Text>
      <Pressable
        onPress={() => callNumber('188', 'cvv')}
        accessibilityRole="button"
        accessibilityLabel="Ligar para o CVV 188"
        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
      >
        <Text style={[styles.primaryLabel, { color: colors.onAccent }]}>
          Ligar para o CVV · 188
        </Text>
      </Pressable>
      <Pressable
        onPress={openCvvChat}
        accessibilityRole="button"
        accessibilityLabel="Conversar com o CVV pelo chat"
        style={[styles.secondaryButton, { backgroundColor: colors.btn }]}
      >
        <Text style={[styles.secondaryLabel, { color: colors.onBtn }]}>
          Conversar com o CVV pelo chat
        </Text>
      </Pressable>
      <Text style={[styles.footer, { color: colors.text2 }]}>
        Em perigo agora:{' '}
        <Text
          onPress={() => callNumber('192', 'samu')}
          accessibilityRole="link"
          accessibilityLabel="Ligar SAMU 192"
          style={{ color: colors.text2 }}
        >
          SAMU 192
        </Text>
        {' · '}
        <Text
          onPress={() => callNumber('190', '190')}
          accessibilityRole="link"
          accessibilityLabel="Ligar Polícia 190"
          style={{ color: colors.text2 }}
        >
          Polícia 190
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  hands: {
    width: 100,
    height: 80,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  titleAccent: {
    fontFamily: fonts.displayItalic,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 25,
  },
  primaryButton: {
    height: 52,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 17,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 17,
    lineHeight: 17,
  },
  footer: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 25,
    textAlign: 'center',
  },
});
