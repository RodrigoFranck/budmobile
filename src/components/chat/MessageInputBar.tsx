import { useMemo, useRef, useState } from 'react';
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
import type { UserContext } from '@/utils/chatStream';
import { getMessageInputBarStyles } from '@/components/chat/MessageInputBar.styles';
import { useMessageInputBarLayout } from '@/components/chat/messageInputBarLayout';

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
  const layout = useMessageInputBarLayout();
  const [message, setMessage] = useState('');
  const messageRef = useRef('');
  const insets = useSafeAreaInsets();

  const hasMessage = message.trim().length > 0;

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      messageRef.current = '';
      Keyboard.dismiss();
    }
  };

  const canSend = hasMessage && !disabled;
  const styles = useMemo(
    () =>
      getMessageInputBarStyles({
        colors,
        bottomInset: insets.bottom,
        layout,
      }),
    [colors, insets.bottom, layout],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Envie uma mensagem"
            placeholderTextColor={colors['chat-label-muted']}
            value={message}
            onChangeText={(text) => {
              messageRef.current = text;
              setMessage(text);
            }}
            multiline
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            scrollEnabled={hasMessage}
            style={styles.textInput}
            {...(Platform.OS === 'android' && {
              includeFontPadding: false,
            })}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            style={[styles.sendButton, { opacity: canSend ? 1 : 0.35 }]}
            hitSlop={styles.sendHitSlop}
          >
            <ChevronUp
              size={Math.round(layout.sendTouchSize * 0.55)}
              color={colors['chat-body']}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
        {voiceInterfaceRef ? (
          <View style={styles.voiceSlot}>
            <VoiceInterface
              ref={voiceInterfaceRef}
              appearance="companion"
              onTranscript={(text) => {
                messageRef.current = text;
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
          </View>
        ) : null}
      </View>
    </View>
  );
}
