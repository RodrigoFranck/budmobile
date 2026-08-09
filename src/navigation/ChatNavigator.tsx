import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatSessionProvider } from '@/features/chat/ChatSessionProvider';
import TextChatScreen from '@/pages/chat/TextChatScreen';
import type { ChatStackParamList } from '@/types/chatNavigation.types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

function ChatStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: true }}>
      <Stack.Screen name="TextChat" component={TextChatScreen} />
    </Stack.Navigator>
  );
}

export default function ChatNavigator() {
  return (
    <ChatSessionProvider>
      <ChatStackNavigator />
    </ChatSessionProvider>
  );
}
