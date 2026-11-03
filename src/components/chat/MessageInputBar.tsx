import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { appAlert } from '@/contexts/AppAlertContext';
import {
  VoiceInterface,
} from '@/voice/VoiceInterface';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { BudMessageField } from '@/components/v3';
import { ChatShareSheet } from '@/components/chat/ChatShareSheet';
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
  paddingTop?: number;
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
  paddingTop = 12,
}: MessageInputBarProps) {
  const isFocused = useIsFocused();
  const [message, setMessage] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
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

  const startVoice = () => {
    if (disabled || !voiceInterfaceRef?.current) return;
    void voiceInterfaceRef.current.startConversation();
  };

  const pickFromCamera = async () => {
    setShareOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        appAlert({
          title: 'Câmera',
          message: 'Permita o acesso à câmera para tirar uma foto.',
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: false,
      });
      if (result.canceled || !result.assets[0]) return;
      appAlert({
        title: 'Em breve',
        message:
          'O envio de fotos no chat ainda está sendo ligado. Sua foto foi capturada, mas ainda não entra na conversa.',
      });
    } catch {
      appAlert({ title: 'Câmera', message: 'Não foi possível abrir a câmera.' });
    }
  };

  const pickFromGallery = async () => {
    setShareOpen(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        appAlert({
          title: 'Galeria',
          message: 'Permita o acesso às fotos para escolher da galeria.',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: false,
      });
      if (result.canceled || !result.assets[0]) return;
      appAlert({
        title: 'Em breve',
        message:
          'O envio de fotos no chat ainda está sendo ligado. A imagem foi escolhida, mas ainda não entra na conversa.',
      });
    } catch {
      appAlert({ title: 'Galeria', message: 'Não foi possível abrir a galeria.' });
    }
  };

  const isProminentVoice = voiceAppearance === 'prominent';

  const voiceSlotContent =
    voiceInterfaceRef && isFocused ? (
      <VoiceInterface
        ref={voiceInterfaceRef}
        appearance={voiceAppearance ?? 'companion'}
        prominentSize={isProminentVoice ? 48 : undefined}
        onTranscript={(text) => {
          // Voice transcript belongs in VoiceMode / chat history — never the composer.
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
        paddingTop,
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
        onAttach={disabled ? undefined : () => setShareOpen(true)}
        onMicPress={disabled ? undefined : startVoice}
        disabled={disabled}
        voiceSlot={voiceSlotContent}
      />
      <ChatShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        onTakePhoto={() => void pickFromCamera()}
        onPickGallery={() => void pickFromGallery()}
      />
    </View>
  );
}
