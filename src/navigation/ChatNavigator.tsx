import { useCallback, useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { ChatSessionProvider, useChatSession } from '@/features/chat/ChatSessionProvider';
import ChatHome from '@/pages/chat/ChatHome';
import TextChatScreen from '@/pages/chat/TextChatScreen';
import { takePendingChatInsight } from '@/utils/navigateToChat';
import type { ChatStackParamList } from '@/types/chatNavigation.types';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ChatStackParamList>();

function ChatInsightHandler() {
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const { applyChatInsight, trySendPendingInsight, chatHomeResetToken } = useChatSession();
  const trySendPendingInsightRef = useRef(trySendPendingInsight);
  const handledInsightKeyRef = useRef<string | null>(null);

  trySendPendingInsightRef.current = trySendPendingInsight;

  useEffect(() => {
    handledInsightKeyRef.current = null;
  }, [chatHomeResetToken]);

  useFocusEffect(
    useCallback(() => {
      const fromParams = route.params?.chatInsight;
      const fromStash = takePendingChatInsight();
      const insight = fromParams ?? fromStash;
      if (!insight) return;

      const insightKey = `${insight.insightType}:${insight.title}:${insight.initialUserMessage ?? ''}`;
      if (handledInsightKeyRef.current === insightKey) return;
      handledInsightKeyRef.current = insightKey;

      applyChatInsight(insight);
      if (fromParams) {
        tabNavigation.setParams({ chatInsight: undefined });
      }

      tabNavigation.navigate('Chat', { screen: 'TextChat' });
      requestAnimationFrame(() => {
        trySendPendingInsightRef.current();
      });
    }, [applyChatInsight, route.params?.chatInsight, tabNavigation]),
  );

  return null;
}

function ChatVoiceInsightHandler() {
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const { handleVoiceInsight } = useChatSession();
  const voiceInsight = route.params?.voiceInsight;

  useEffect(() => {
    if (!voiceInsight) return;
    handleVoiceInsight(voiceInsight);
    tabNavigation.navigate('Chat', { screen: 'TextChat' });
  }, [handleVoiceInsight, tabNavigation, voiceInsight]);

  return null;
}

function ChatStackResetHandler() {
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const { chatHomeResetToken } = useChatSession();

  useEffect(() => {
    if (chatHomeResetToken === 0) return;
    tabNavigation.navigate('Chat', { screen: 'ChatHome' });
  }, [chatHomeResetToken, tabNavigation]);

  return null;
}

function ChatStackNavigator() {
  return (
    <>
      <ChatInsightHandler />
      <ChatVoiceInsightHandler />
      <ChatStackResetHandler />
      <Stack.Navigator
        screenOptions={{ headerShown: false, detachInactiveScreens: true }}
      >
        <Stack.Screen name="ChatHome" component={ChatHome} />
        <Stack.Screen
          name="TextChat"
          component={TextChatScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </>
  );
}

export default function ChatNavigator() {
  return (
    <ChatSessionProvider>
      <ChatStackNavigator />
    </ChatSessionProvider>
  );
}
