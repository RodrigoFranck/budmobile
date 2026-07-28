import { useCallback } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { Spacing } from '@/constants/styles';
import { PlatformConstants } from '@/constants/layout';
import { useTabScreenLoading } from '@/contexts/TabScreenContext';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useAppColors } from '@/lib/colors';
import type { ChatStackNavigationProp } from '@/types/chatNavigation.types';
import { VoiceMode } from '@/voice/VoiceMode';

export default function TextChatScreen() {
  const colors = useAppColors();
  const tabLoading = useTabScreenLoading('Chat');
  const navigation = useNavigation<ChatStackNavigationProp>();
  const {
    allMessages,
    isStreaming,
    messagesLoading,
    memoryLoading,
    internalProfileText,
    voiceInterfaceRef,
    isVoiceModeActive,
    setIsVoiceModeActive,
    isVoiceConnecting,
    setIsVoiceConnecting,
    isVoiceSessionBusy,
    setIsVoiceSessionBusy,
    voiceTranscript,
    setVoiceTranscript,
    isBudSpeaking,
    setIsBudSpeaking,
    isVoicePaused,
    setIsVoicePaused,
    isVoiceMicMuted,
    setIsVoiceMicMuted,
    userContext,
    messageHistory,
    recentInsights,
    handleSendMessage,
    handleVoiceUserMessage,
    handleVoiceAssistantMessage,
    handleEndVoiceSession,
    handleToggleVoicePause,
    handleToggleVoiceMute,
    handleAssistantRevealComplete,
    bootstrapInsightSession,
  } = useChatSession();

  useFocusEffect(
    useCallback(() => {
      if (tabLoading) return;
      bootstrapInsightSession();
    }, [bootstrapInsightSession, tabLoading]),
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ChatHome');
  }, [navigation]);

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View className="flex-1 bg-background">
        <LinearGradient
          colors={[colors['chat-warm-bg'], colors['chat-gradient-end']]}
          locations={[0.35, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <KeyboardAvoidingView
          behavior={PlatformConstants.keyboardBehavior}
          className="flex-1"
          keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
        >
          <TabScreenHeader>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para início do chat"
              onPress={handleBack}
              hitSlop={12}
              style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
            >
              <ChevronLeft size={28} color={colors.foreground} />
            </Pressable>
          </TabScreenHeader>
          <ChatContainer
            messages={allMessages}
            loading={isStreaming || messagesLoading}
            topPadding={Spacing.base}
            onAssistantRevealComplete={handleAssistantRevealComplete}
          />
          <MessageInputBar
            autoFocus
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
            voiceAppearance="prominent"
            voiceInterfaceRef={voiceInterfaceRef}
            onVoiceModeChange={setIsVoiceModeActive}
            onVoiceConnectingChange={setIsVoiceConnecting}
            onVoiceSessionBusyChange={setIsVoiceSessionBusy}
            onVoicePausedChange={setIsVoicePaused}
            onVoiceMicMutedChange={setIsVoiceMicMuted}
            onVoiceUserMessage={handleVoiceUserMessage}
            onVoiceAssistantMessage={handleVoiceAssistantMessage}
            onVoiceTranscript={setVoiceTranscript}
            onSpeakingChange={setIsBudSpeaking}
            userContext={userContext}
            messageHistory={messageHistory}
            recentInsights={recentInsights}
            internalProfile={memoryLoading ? undefined : internalProfileText}
          />
        </KeyboardAvoidingView>
        <VoiceMode
          visible={isVoiceModeActive}
          onClose={() => setIsVoiceModeActive(false)}
          onEndVoice={handleEndVoiceSession}
          onTogglePause={handleToggleVoicePause}
          onToggleMute={handleToggleVoiceMute}
          transcript={voiceTranscript}
          isBudSpeaking={isBudSpeaking}
          isConnecting={isVoiceConnecting}
          isSessionBusy={isVoiceSessionBusy}
          isPaused={isVoicePaused}
          isMicMuted={isVoiceMicMuted}
        />
      </View>
    </ScreenLoadingGate>
  );
}
