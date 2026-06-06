import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { Book, Settings } from 'lucide-react-native';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { MessageInputBar } from '@/components/chat/MessageInputBar';
import { ScreenLoadingGate } from '@/components/ui/ScreenLoadingGate';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { WeekCalendarHeader } from '@/components/ui/WeekCalendarHeader';
import { Spacing } from '@/constants/styles';
import { useTabScreenLoading } from '@/contexts/TabScreenContext';
import { useChatSession } from '@/features/chat/ChatSessionProvider';
import { useAppColors } from '@/lib/colors';
import type { ChatStackNavigationProp } from '@/types/chatNavigation.types';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';
import { VoiceMode } from '@/voice/VoiceMode';

export default function ChatHome() {
  const colors = useAppColors();
  const tabLoading = useTabScreenLoading('Chat');
  const navigation = useNavigation<ChatStackNavigationProp>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const {
    chatHomeResetToken,
    voiceInterfaceRef,
    isVoiceModeActive,
    setIsVoiceModeActive,
    isVoiceConnecting,
    setIsVoiceConnecting,
    voiceTranscript,
    setVoiceTranscript,
    isBudSpeaking,
    setIsBudSpeaking,
    userContext,
    messageHistory,
    recentInsights,
    memoryLoading,
    internalProfileText,
    handleVoiceUserMessage,
    handleVoiceAssistantMessage,
    handleEndVoiceSession,
  } = useChatSession();

  const openTextChat = () => {
    navigation.navigate('TextChat');
  };

  return (
    <ScreenLoadingGate loading={tabLoading}>
      <View className="flex-1 bg-background">
        <LinearGradient
          colors={[colors['chat-warm-bg'], colors['chat-gradient-end']]}
          locations={[0.35, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="flex-1">
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
            messages={[]}
            topPadding={Spacing.base}
            scrollResetToken={chatHomeResetToken}
          />
          <MessageInputBar
            mode="trigger"
            onPressTrigger={openTextChat}
            voiceInterfaceRef={voiceInterfaceRef}
            onVoiceModeChange={setIsVoiceModeActive}
            onVoiceConnectingChange={setIsVoiceConnecting}
            onVoiceUserMessage={handleVoiceUserMessage}
            onVoiceAssistantMessage={handleVoiceAssistantMessage}
            onVoiceTranscript={setVoiceTranscript}
            onSpeakingChange={setIsBudSpeaking}
            userContext={userContext}
            messageHistory={messageHistory}
            recentInsights={recentInsights}
            internalProfile={memoryLoading ? undefined : internalProfileText}
          />
        </View>
        <VoiceMode
          visible={isVoiceModeActive}
          onClose={() => setIsVoiceModeActive(false)}
          onEndVoice={handleEndVoiceSession}
          transcript={voiceTranscript}
          isBudSpeaking={isBudSpeaking}
          isConnecting={isVoiceConnecting}
        />
      </View>
    </ScreenLoadingGate>
  );
}
