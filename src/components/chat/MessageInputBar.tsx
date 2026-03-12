import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import {
  VoiceInterface,
  type VoiceInterfaceRef,
} from '@/voice/VoiceInterface';
import { colors } from '@/lib/colors';
import { Typography, Spacing, InputHeight } from '@/constants/styles';
import { ChatConstants } from '@/constants/layout';
import type { UserContext } from '@/utils/chatStream';

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
      className="border-t border-border bg-background"
      style={{
        paddingTop: Spacing.base,
        paddingBottom: Math.max(insets.bottom, Spacing.base),
        paddingHorizontal: Spacing.base,
      }}
    >
      <View className="flex-row items-end gap-2">
        <View className="relative min-h-[44px] max-h-[120px] flex-1 flex-row items-end rounded-lg border border-input bg-background">
          <TextInput
            className="min-h-[44px] flex-1 py-2 pl-4 pr-12 text-foreground"
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
          {voiceInterfaceRef && (
            <View className="absolute bottom-1 right-1">
              <VoiceInterface
                ref={voiceInterfaceRef}
                onTranscript={(text) => setMessage(text)}
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
          )}
        </View>
        <Button
          onPress={handleSend}
          disabled={!message.trim() || !!disabled}
          size="icon"
          className="h-[44px] w-[44px]"
        >
          →
        </Button>
      </View>
    </View>
  );
}
