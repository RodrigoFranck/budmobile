import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ChatSessionProvider, useChatSession } from '@/features/chat/ChatSessionProvider';
import ChatHome from '@/pages/chat/ChatHome';
import TextChatScreen from '@/pages/chat/TextChatScreen';
import type { ChatStackParamList } from '@/types/chatNavigation.types';
import type { MainTabNavigationProp } from '@/types/navigation';

const Stack = createNativeStackNavigator<ChatStackParamList>();

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
