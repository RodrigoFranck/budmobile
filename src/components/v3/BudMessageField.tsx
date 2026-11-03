import type { ReactNode } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowUp, Mic, Plus } from 'lucide-react-native';

import { fonts, useV3Colors } from '@/theme';

interface BudMessageFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onMicPress?: () => void;
  onVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
  voiceSlot?: ReactNode;
}

export function BudMessageField({
  value,
  onChangeText,
  onSend,
  onAttach,
  onMicPress,
  placeholder = 'Escreva pro Bud…',
  disabled,
  voiceSlot,
}: BudMessageFieldProps) {
  const colors = useV3Colors();
  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity
        onPress={onAttach}
        disabled={disabled || !onAttach}
        accessibilityRole="button"
        accessibilityLabel="Compartilhar com o Bud"
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled || !onAttach ? 0.45 : 1,
        }}
      >
        <Plus color={colors.text} size={22} strokeWidth={2} />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          minHeight: 56,
          borderRadius: 28,
          backgroundColor: colors.surface2,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 22,
          paddingRight: 8,
          gap: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          editable={!disabled}
          multiline
          style={{
            flex: 1,
            fontFamily: fonts.sans,
            fontSize: 16,
            lineHeight: 20,
            color: colors.text,
            paddingVertical: 14,
            maxHeight: 120,
          }}
        />
        <TouchableOpacity
          onPress={onMicPress}
          disabled={disabled || !onMicPress}
          accessibilityRole="button"
          accessibilityLabel="Falar no campo"
          hitSlop={8}
          style={{ opacity: disabled || !onMicPress ? 0.35 : 1 }}
        >
          <Mic color={colors.text3} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: canSend ? colors.btn : colors.surface2,
          }}
        >
          <ArrowUp
            color={canSend ? colors.onBtn : colors.text3}
            size={20}
            strokeWidth={2.25}
          />
        </TouchableOpacity>
      </View>

      {voiceSlot ? <View style={{ justifyContent: 'center' }}>{voiceSlot}</View> : null}
    </View>
  );
}
