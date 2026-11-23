import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudButton } from '@/components/v3';
import { fonts, useV3Colors } from '@/theme';

/**
 * TF-113 · Quota exhausted: chat stays readable; composer/mic replaced by Assinar.
 * Opens monthly paywall first (chat_bloqueio_mensal).
 */
export function ChatQuotaBlockedBar({
  onPressAssinar,
  onPressHelp,
}: {
  onPressAssinar: () => void;
  onPressHelp?: () => void;
}) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <Text style={[styles.copy, { color: colors.text2 }]}>
        Você chegou ao fim das suas conversas grátis deste mês. Assine para continuar conversando.
      </Text>
      <BudButton label="Assinar" onPress={onPressAssinar} />
      {onPressHelp ? (
        <Pressable
          onPress={onPressHelp}
          accessibilityRole="link"
          accessibilityLabel="Preciso de ajuda agora"
          style={styles.helpHit}
        >
          <Text style={[styles.help, { color: colors.accent }]}>Preciso de ajuda agora</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    paddingTop: 14,
    gap: 14,
  },
  copy: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  helpHit: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  help: {
    fontFamily: fonts.sansSemi,
    fontSize: 13.5,
    lineHeight: 13.5,
  },
});
