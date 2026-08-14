import { useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Book, Settings } from 'lucide-react-native';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { Spacing } from '@/constants/styles';
import { PlatformConstants } from '@/constants/layout';
import { useTabScreenLoading } from '@/contexts/TabScreenContext';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useAppColors } from '@/lib/colors';
import type {
  ChatStackNavigationProp,
  ChatStackParamList,
} from '@/types/chatNavigation.types';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';
import { VoiceMode } from '@/voice/VoiceMode';

import { createTextChatScreenStyles } from './TextChatScreen.styles';

export default function TextChatScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createTextChatScreenStyles(colors), [colors]);
  const tabLoading = useTabScreenLoading('Chat');
  const navigation = useNavigation<ChatStackNavigationProp>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProp<ChatStackParamList, 'TextChat'>>();
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
    chatHomeResetToken,
    handleSendMessage,
    handleVoiceUserMessage,
    handleVoiceAssistantMessage,
    handleEndVoiceSession,
    handleToggleVoicePause,
    handleToggleVoiceMute,
    handleAssistantRevealComplete,
    requestAutoStartVoice,
    bootstrapInsightSession,
  } = useChatSession();

  useFocusEffect(
    useCallback(() => {
      if (tabLoading) return;

      if (route.params?.autoStartVoice) {
        requestAutoStartVoice();
        navigation.setParams({ autoStartVoice: undefined });
      }

      bootstrapInsightSession();
    }, [
      bootstrapInsightSession,
      navigation,
      requestAutoStartVoice,
      route.params?.autoStartVoice,
      tabLoading,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        void voiceInterfaceRef.current?.endConversation({ force: true });
        setIsVoiceModeActive(false);
      };
    }, [setIsVoiceModeActive, voiceInterfaceRef]),
  );

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={styles.root}>
        <KeyboardAvoidingView
          behavior={PlatformConstants.keyboardBehavior}
          style={styles.keyboard}
          keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
        >
          <TabScreenHeader>
            <WeekCalendarHeader
              leftIcon={Book}
              onPressLeft={() => tabNavigation.navigate('Explore')}
              showLeftIndicatorDot
              rightIcon={Settings}
              onPressRight={() => rootNavigation.navigate('Settings')}
            />
          </TabScreenHeader>
          <ChatContainer
            messages={allMessages}
            loading={isStreaming || messagesLoading}
            topPadding={Spacing.base}
            scrollResetToken={chatHomeResetToken}
            onAssistantRevealComplete={handleAssistantRevealComplete}
          />
          <MessageInputBar
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
