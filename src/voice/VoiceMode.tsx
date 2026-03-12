import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/lib/colors';
import { Typography } from '@/constants/styles';

interface VoiceModeProps {
  visible: boolean;
  onClose: () => void;
  onEndVoice?: () => void;
  transcript?: string;
  isBudSpeaking?: boolean;
}

export function VoiceMode({
  visible,
  onClose,
  onEndVoice,
  transcript = '',
  isBudSpeaking = false,
}: VoiceModeProps) {
  const [displayedText, setDisplayedText] = useState('');

  const handleClose = () => {
    onEndVoice?.();
    onClose();
  };

  useEffect(() => {
    if (!transcript) {
      setDisplayedText('');
      return;
    }
    const words = transcript.split(' ');
    let currentIndex = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
        currentIndex += 1;
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [transcript]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center px-6">
          <Text
            className="text-center text-foreground"
            style={{ fontSize: Typography.lg, lineHeight: 28 }}
          >
            {displayedText || 'Ouvindo...'}
          </Text>
          <Text
            className="mt-8 text-center uppercase tracking-wider"
            style={{
              fontSize: Typography.sm,
              color: colors['foreground-muted'],
            }}
          >
            {isBudSpeaking ? 'BUD ESTÁ FALANDO' : 'OUVINDO VOCÊ'}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            className="mt-12 self-center rounded-lg px-6 py-3"
            style={{ backgroundColor: colors.muted }}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao teclado"
          >
            <Text style={{ color: colors.foreground }}>Teclado</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
