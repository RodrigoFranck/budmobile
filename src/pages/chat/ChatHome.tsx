import { useCallback } from 'react';
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
import { useAppColors } from '@/lib/colors';
import type { ChatStackNavigationProp } from '@/types/chatNavigation.types';
import type { MainTabNavigationProp, RootNavigationProp } from '@/types/navigation';

export default function ChatHome() {
  const colors = useAppColors();
  const tabLoading = useTabScreenLoading('Chat');
  const navigation = useNavigation<ChatStackNavigationProp>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const openTextChat = useCallback(() => {
    navigation.navigate('TextChat');
  }, [navigation]);

  const openVoiceChat = useCallback(() => {
    navigation.navigate('TextChat', { autoStartVoice: true });
  }, [navigation]);

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
          />
          <MessageInputBar
            mode="trigger"
            onPressTrigger={openTextChat}
            onPressVoice={openVoiceChat}
            voiceAppearance="prominent"
          />
        </View>
      </View>
    </ScreenLoadingGate>
  );
}
