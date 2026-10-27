import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  VoiceInterface,
} from '@/voice/VoiceInterface';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { BudMessageField } from '@/components/v3';
import type { UserContext } from '@/utils/chatStream';

interface MessageInputBarProps {
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
  const isFocused = useIsFocused();
  const [message, setMessage] = useState('');
  const messageRef = useRef('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isFocused) return;
    Keyboard.dismiss();
  }, [isFocused]);

  const handleSend = () => {
    if (message.trim() && !disabled && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
      messageRef.current = '';
      Keyboard.dismiss();
    }
  };

  const isProminentVoice = voiceAppearance === 'prominent';

  const voiceSlotContent =
    voiceInterfaceRef && isFocused ? (
      <VoiceInterface
        ref={voiceInterfaceRef}
        appearance={voiceAppearance ?? 'companion'}
        prominentSize={isProminentVoice ? 56 : undefined}
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
    <View
      style={{
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <BudMessageField
        value={message}
        onChangeText={(text) => {
          messageRef.current = text;
          setMessage(text);
        }}
        onSend={handleSend}
        disabled={disabled}
        voiceSlot={voiceSlotContent}
      />
    </View>
  );
}
