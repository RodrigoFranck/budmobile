import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp } from 'lucide-react-native';
import {
  VoiceInterface,
} from '@/voice/VoiceInterface';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { useAppColors } from '@/lib/colors';
import type { UserContext } from '@/utils/chatStream';
import { getMessageInputBarStyles } from '@/components/chat/MessageInputBar.styles';
import { useMessageInputBarLayout } from '@/components/chat/messageInputBarLayout';

interface MessageInputBarProps {
  autoFocus?: boolean;
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  voiceInterfaceRef?: React.RefObject<VoiceInterfaceRef | null>;
  onVoiceModeChange?: (active: boolean) => void;
  onVoiceConnectingChange?: (connecting: boolean) => void;
  onVoiceSessionBusyChange?: (busy: boolean) => void;
  onVoicePausedChange?: (paused: boolean) => void;
  onVoiceMicMutedChange?: (muted: boolean) => void;
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
  voiceAppearance?: 'default' | 'companion' | 'prominent';
}

export function MessageInputBar({
  autoFocus = false,
  onSendMessage,
  disabled,
  voiceInterfaceRef,
  onVoiceModeChange,
  onVoiceConnectingChange,
  onVoiceSessionBusyChange,
  onVoicePausedChange,
  onVoiceMicMutedChange,
  onVoiceUserMessage,
  onVoiceAssistantMessage,
  onVoiceTranscript,
  onSpeakingChange,
  onSafetyTriggered,
  userContext,
  messageHistory,
  recentInsights,
  internalProfile,
  voiceAppearance,
}: MessageInputBarProps) {
  const colors = useAppColors();
  const isFocused = useIsFocused();
  const layout = useMessageInputBarLayout();
  const [message, setMessage] = useState('');
  const messageRef = useRef('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!autoFocus || !isFocused) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoFocus, isFocused]);

  const hasMessage = message.trim().length > 0;

  const handleSend = () => {
    if (message.trim() && !disabled && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
      messageRef.current = '';
      Keyboard.dismiss();
    }
  };

  const canSend = hasMessage && !disabled;
  const isProminentVoice = voiceAppearance === 'prominent';
  const sendIconSize = Math.round(layout.sendTouchSize * 0.48);
  const sendIconColor = colors['chat-warm-bg'];
  const sendButtonDisabledStyle = {
    backgroundColor: `${colors['chat-accent-mint']}59`,
  } as const;

  const styles = useMemo(
    () =>
      getMessageInputBarStyles({
        colors,
        bottomInset: insets.bottom,
        layout,
        prominentVoice: isProminentVoice,
      }),
    [colors, insets.bottom, isProminentVoice, layout],
  );

  const voiceSlotContent =
    voiceInterfaceRef && isFocused ? (
      <VoiceInterface
        ref={voiceInterfaceRef}
        appearance={voiceAppearance ?? 'companion'}
        prominentSize={isProminentVoice ? layout.pillHeight : undefined}
        onTranscript={(text) => {
          messageRef.current = text;
          setMessage(text);
          onVoiceTranscript?.(text);
        }}
        onVoiceModeChange={onVoiceModeChange}
        onConnectingChange={onVoiceConnectingChange}
        onSessionBusyChange={onVoiceSessionBusyChange}
        onPausedChange={onVoicePausedChange}
        onMicMutedChange={onVoiceMicMutedChange}
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
    ) : null;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
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
            style={[styles.sendButton, !canSend && sendButtonDisabledStyle]}
            hitSlop={styles.sendHitSlop}
          >
            <ArrowUp
              size={sendIconSize}
              color={canSend ? sendIconColor : `${sendIconColor}8C`}
              strokeWidth={3}
            />
          </TouchableOpacity>
        </View>
        {voiceSlotContent ? (
          <View style={styles.voiceSlot}>{voiceSlotContent}</View>
        ) : null}
      </View>
    </View>
  );
}
