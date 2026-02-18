import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/colors';
import { Typography, Spacing, InputHeight } from '@/constants/styles';
import { ChatConstants } from '@/constants/layout';

interface MessageInputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function MessageInputBar({ onSendMessage, disabled }: MessageInputBarProps) {
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View 
      className="bg-background border-t border-border"
      style={{
        paddingTop: Spacing.base,
        paddingBottom: Math.max(insets.bottom, Spacing.base),
        paddingHorizontal: Spacing.base,
      }}
    >
      <View className="flex-row items-end gap-2">
        <TextInput
          className="flex-1 min-h-[44px] max-h-[120px] rounded-lg border border-input bg-background px-4 py-2 text-foreground"
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors['foreground-muted']}
          value={message}
          onChangeText={setMessage}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          style={{ 
            fontSize: Typography.base, 
            lineHeight: Typography.lineHeight.normal,
            minHeight: InputHeight.md,
            maxHeight: ChatConstants.inputMaxHeight,
          }}
        />
        <Button
          onPress={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-[44px] w-[44px]"
        >
          →
        </Button>
      </View>
    </View>
  );
}

