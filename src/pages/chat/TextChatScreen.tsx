import { useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { Spacing } from '@/constants/styles';
import { PlatformConstants } from '@/constants/layout';
import { useTabScreenLoading } from '@/contexts/TabScreenContext';
import { BudIconButton } from '@/components/v3';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useUserPlan } from '@/hooks/useUserPlan';
import { LastFreeConversationBanner } from '@/pages/paywall/LastFreeConversationBanner';
import { useV3Colors } from '@/theme';
import type {
  ChatStackNavigationProp,
  ChatStackParamList,
} from '@/types/chatNavigation.types';
import type { MainTabNavigationProp } from '@/types/navigation';
import { VoiceMode } from '@/voice/VoiceMode';

export default function TextChatScreen() {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const tabLoading = useTabScreenLoading('Chat');
  const navigation = useNavigation<ChatStackNavigationProp>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const { canSendInConversation, isLastFreeConversation } = useUserPlan();
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
    handleSendImage,
    handleVoiceUserMessage,
    handleVoiceAssistantMessage,
    handleEndVoiceSession,
    handleToggleVoicePause,
    handleToggleVoiceMute,
    handleAssistantRevealComplete,
    requestAutoStartVoice,
    bootstrapInsightSession,
    currentConversationId,
  } = useChatSession();
  const canSendMessage = canSendInConversation(currentConversationId ?? null);
  const showLastFreeBanner = isLastFreeConversation || !canSendMessage;

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

  const styles = useMemo(
    () => ({
      root: { flex: 1, backgroundColor: colors.bg },
      keyboard: { flex: 1 },
    }),
    [colors.bg],
  );

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View style={styles.root}>
        <KeyboardAvoidingView
          behavior={PlatformConstants.keyboardBehavior}
          style={styles.keyboard}
          keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
        >
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: 20,
              paddingBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <BudIconButton
              icon={ChevronLeft}
              accessibilityLabel="Início"
              onPress={() => tabNavigation.navigate('Home')}
            />
          </View>
          <ChatContainer
            messages={allMessages}
            loading={isStreaming || messagesLoading}
            topPadding={Spacing.base}
            scrollResetToken={chatHomeResetToken}
            onAssistantRevealComplete={handleAssistantRevealComplete}
          />
          {showLastFreeBanner ? (
            <LastFreeConversationBanner onPressPlans={() => tabNavigation.navigate('Paywall')} />
          ) : null}
          <MessageInputBar
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            disabled={isStreaming || !canSendMessage}
            paddingTop={showLastFreeBanner ? 14 : 12}
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
