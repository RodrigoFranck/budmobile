import { useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, Linking, View } from 'react-native';
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
import { CRISIS_RESOURCES } from '@/constants/healthSafety';
import { useTabScreenLoading } from '@/contexts/TabScreenContext';
import { BudIconButton } from '@/components/v3';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useUserPlan } from '@/hooks/useUserPlan';
import { ChatQuotaBlockedBar } from '@/pages/paywall/ChatQuotaBlockedBar';
import { FreeQuotaBar } from '@/pages/paywall/FreeQuotaBar';
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
  const {
    canSendInConversation,
    showQuotaBar,
    cotaRestantePct,
    renovaEm,
    isQuotaExhausted,
    refetch: refetchPlan,
  } = useUserPlan();
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

  const openPaywall = useCallback(() => {
    tabNavigation.navigate('Paywall', { interval: 'monthly' });
  }, [tabNavigation]);

  useFocusEffect(
    useCallback(() => {
      if (tabLoading) return;

      if (route.params?.autoStartVoice) {
        if (canSendMessage) {
          requestAutoStartVoice();
        } else {
          openPaywall();
        }
        navigation.setParams({ autoStartVoice: undefined });
      }

      bootstrapInsightSession();
      void refetchPlan();
    }, [
      bootstrapInsightSession,
      canSendMessage,
      navigation,
      openPaywall,
      refetchPlan,
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

  const onAssistantRevealComplete = useCallback(
    (messageId: string | number) => {
      handleAssistantRevealComplete(messageId);
      // TF-115: refresh remaining bar after Bud finishes (animate in FreeQuotaBar).
      void refetchPlan();
    },
    [handleAssistantRevealComplete, refetchPlan],
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
            onAssistantRevealComplete={onAssistantRevealComplete}
          />
          {showQuotaBar ? (
            <FreeQuotaBar
              cotaRestantePct={cotaRestantePct}
              renovaEm={renovaEm}
              onPressAssinar={openPaywall}
            />
          ) : null}
          {isQuotaExhausted ? (
            <ChatQuotaBlockedBar
              onPressAssinar={openPaywall}
              onPressHelp={() => {
                const cvv = CRISIS_RESOURCES.find((r) => r.id === 'cvv');
                if (cvv?.url) void Linking.openURL(cvv.url);
              }}
            />
          ) : (
            <MessageInputBar
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              disabled={isStreaming || !canSendMessage}
              paddingTop={showQuotaBar ? 8 : 12}
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
          )}
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
