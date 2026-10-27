import type { ReactNode } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Send } from 'lucide-react-native';

import { fonts, useV3Colors } from '@/theme';

interface BudMessageFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
  voiceSlot?: ReactNode;
}

export function BudMessageField({
  value,
  onChangeText,
  onSend,
  placeholder = 'Escreva pro Bud…',
  disabled,
  voiceSlot,
}: BudMessageFieldProps) {
  const colors = useV3Colors();
  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          flex: 1,
          minHeight: 56,
          borderRadius: 28,
          backgroundColor: colors.surface2,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
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
            color: colors.text,
            paddingVertical: 14,
            maxHeight: 120,
          }}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          style={{ marginLeft: 8, opacity: canSend ? 1 : 0.35 }}
        >
          <Send color={colors.text} size={20} />
        </TouchableOpacity>
      </View>
      {voiceSlot ? <View style={{ justifyContent: 'center' }}>{voiceSlot}</View> : null}
    </View>
  );
}
