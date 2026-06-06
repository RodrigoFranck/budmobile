import { useCallback, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  StackActions,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { ChatSessionProvider, useChatSession } from '@/features/chat/ChatSessionProvider';
import ChatHome from '@/pages/chat/ChatHome';
import TextChatScreen from '@/pages/chat/TextChatScreen';
import { takePendingChatInsight } from '@/utils/navigateToChat';
import type { ChatStackNavigationProp, ChatStackParamList } from '@/types/chatNavigation.types';
import type { MainTabNavigationProp, MainTabParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ChatStackParamList>();

function ChatInsightHandler() {
  const navigation = useNavigation<ChatStackNavigationProp>();
  const tabNavigation = useNavigation<MainTabNavigationProp>();
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const { applyChatInsight, trySendPendingInsight } = useChatSession();

  useFocusEffect(
    useCallback(() => {
      const fromParams = route.params?.chatInsight;
      const fromStash = takePendingChatInsight();
      const insight = fromParams ?? fromStash;
      if (!insight) return;

      applyChatInsight(insight);
      if (fromParams) {
        tabNavigation.setParams({ chatInsight: undefined });
      }

      navigation.navigate('TextChat');
      requestAnimationFrame(() => {
        trySendPendingInsight();
      });
    }, [applyChatInsight, navigation, route.params?.chatInsight, tabNavigation, trySendPendingInsight]),
  );

  return null;
}

function ChatVoiceInsightHandler() {
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const { handleVoiceInsight } = useChatSession();
  const voiceInsight = route.params?.voiceInsight;

  useEffect(() => {
    if (!voiceInsight) return;
    handleVoiceInsight(voiceInsight);
  }, [handleVoiceInsight, voiceInsight]);

  return null;
}

function ChatStackResetHandler() {
  const navigation = useNavigation<ChatStackNavigationProp>();
  const { chatHomeResetToken } = useChatSession();

  useEffect(() => {
    if (chatHomeResetToken === 0) return;
    navigation.dispatch(StackActions.popToTop());
  }, [chatHomeResetToken, navigation]);

  return null;
}

function ChatStackNavigator() {
  return (
    <>
      <ChatInsightHandler />
      <ChatVoiceInsightHandler />
      <ChatStackResetHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
