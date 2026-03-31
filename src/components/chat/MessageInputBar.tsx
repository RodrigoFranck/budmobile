import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronUp } from 'lucide-react-native';
import {
  VoiceInterface,
  type VoiceInterfaceRef,
} from '@/voice/VoiceInterface';
import { useAppColors } from '@/lib/colors';
// styles live in MessageInputBar.styles.ts
import type { UserContext } from '@/utils/chatStream';
import { createMessageInputBarStyles } from '@/components/chat/MessageInputBar.styles';

interface MessageInputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  voiceInterfaceRef?: React.RefObject<VoiceInterfaceRef | null>;
  onVoiceModeChange?: (active: boolean) => void;
  onVoiceUserMessage?: (text: string) => void;
  onVoiceAssistantMessage?: (text: string) => void;
  onVoiceTranscript?: (text: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onSafetyTriggered?: () => void;
  userContext?: UserContext;
  messageHistory?: Array<{ role: string; content: string }>;
  recentInsights?: Array<{
    insight_type: string;
    title: string;
    description: string;
  }>;
  internalProfile?: string | null;
}

export function MessageInputBar({
  onSendMessage,
  disabled,
  voiceInterfaceRef,
  onVoiceModeChange,
  onVoiceUserMessage,
  onVoiceAssistantMessage,
  onVoiceTranscript,
  onSpeakingChange,
  onSafetyTriggered,
  userContext,
  messageHistory,
  recentInsights,
  internalProfile,
}: MessageInputBarProps) {
  const colors = useAppColors();
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      Keyboard.dismiss();
    }
  };

  const canSend = message.trim().length > 0 && !disabled;
  const styles = createMessageInputBarStyles({
    colors,
    bottomInset: insets.bottom,
    isIOS: Platform.OS === 'ios',
    canSend,
  });

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Envie uma mensagem"
            placeholderTextColor={colors['chat-label-muted']}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            style={styles.sendButton}
            hitSlop={styles.sendHitSlop}
          >
            <ChevronUp size={22} color={colors['chat-body']} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        {voiceInterfaceRef ? (
          <VoiceInterface
            ref={voiceInterfaceRef}
            appearance="companion"
            onTranscript={(text) => {
              setMessage(text);
              onVoiceTranscript?.(text);
            }}
            onVoiceModeChange={onVoiceModeChange}
            onUserMessage={onVoiceUserMessage}
            onAssistantMessage={onVoiceAssistantMessage}
            onAssistantTranscript={onVoiceTranscript}
            onSpeakingChange={onSpeakingChange}
            onSafetyTriggered={onSafetyTriggered}
            userContext={userContext}
            messageHistory={messageHistory}
            recentInsights={recentInsights}
            internalProfile={internalProfile}
          />
        ) : null}
      </View>
    </View>
  );
}
