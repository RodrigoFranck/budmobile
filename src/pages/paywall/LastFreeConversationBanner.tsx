import { Pressable, Text, View } from 'react-native';

import { fonts, useV3Colors } from '@/theme';
import { PaywallSparkleIcon } from '@/pages/paywall/paywallIcons';

export function LastFreeConversationBanner({ onPressPlans }: { onPressPlans: () => void }) {
  const colors = useV3Colors();

  return (
    <View
      style={{
        marginHorizontal: 16,
        minHeight: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 7,
        gap: 6,
      }}
    >
      <View style={{ flexShrink: 0 }}>
        <PaywallSparkleIcon color={colors.accent} />
      </View>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumScaleFactor={0.85}
        style={{
          flex: 1,
          flexShrink: 1,
          fontFamily: fonts.sansSemi,
          fontSize: 14.5,
          lineHeight: 17,
          color: colors.text,
          includeFontPadding: false,
        }}
      >
        Esta é a sua última conversa grátis
      </Text>
      <Pressable
        onPress={onPressPlans}
        accessibilityRole="button"
        accessibilityLabel="Ver planos"
        style={{
          flexShrink: 0,
          height: 34,
          borderRadius: 20,
          paddingHorizontal: 14,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansSemi,
            fontSize: 13.5,
            lineHeight: 13.5,
            color: colors.onAccent,
          }}
        >
          Ver planos
        </Text>
      </Pressable>
    </View>
  );
}
