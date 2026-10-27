import { useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, Share, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Menu, Share2 } from 'lucide-react-native';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { Spacing } from '@/constants/styles';
import { PlatformConstants } from '@/constants/layout';
import { useTabScreenContext, useTabScreenLoading } from '@/contexts/TabScreenContext';
import { BudButton, BudIconButton } from '@/components/v3';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useUserPlan } from '@/hooks/useUserPlan';
import { fonts, useV3Colors } from '@/theme';
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
  const { canSendMessage } = useUserPlan();
  const { deepInsight, deepInsightProgress } = useTabScreenContext();
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

  const canShareWeek = Boolean(deepInsight.title || deepInsight.description) && !deepInsightProgress.locked;

  const shareWeek = useCallback(async () => {
    const title = deepInsight.title || 'Resumo da semana com o Bud';
    const body = deepInsight.description || 'Uma semana de conversas com o Bud.';
    await Share.share({ message: `${title}\n\n${body}` });
  }, [deepInsight.description, deepInsight.title]);

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
              justifyContent: 'space-between',
            }}
          >
            <BudIconButton
              icon={ChevronLeft}
              accessibilityLabel="Início"
              onPress={() => tabNavigation.navigate('Home')}
            />
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.text }}>Chat</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {canShareWeek ? (
                <BudIconButton
                  icon={Share2}
                  accessibilityLabel="Compartilhar resumo da semana"
                  onPress={() => void shareWeek()}
                />
              ) : null}
              <BudIconButton
                icon={Menu}
                accessibilityLabel="Menu"
                onPress={() => tabNavigation.navigate('Menu')}
              />
            </View>
          </View>
          <ChatContainer
            messages={allMessages}
            loading={isStreaming || messagesLoading}
            topPadding={Spacing.base}
            scrollResetToken={chatHomeResetToken}
            onAssistantRevealComplete={handleAssistantRevealComplete}
          />
          <MessageInputBar
            onSendMessage={handleSendMessage}
            disabled={isStreaming || !canSendMessage}
            voiceAppearance="prominent"
            voiceInterfaceRef={canSendMessage ? voiceInterfaceRef : undefined}
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
        {!canSendMessage ? (
          <View
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 108,
              borderRadius: 20,
              backgroundColor: colors.surface,
              padding: 20,
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text }}>
              Sua conversa continua aqui
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.text2, marginTop: 8 }}>
              Para enviar novas mensagens, escolha um plano.
            </Text>
            <BudButton
              label="Ver planos"
              onPress={() => tabNavigation.navigate('Paywall')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : null}
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
