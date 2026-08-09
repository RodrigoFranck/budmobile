import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type ChatStackParamList = {
  ChatHome: undefined;
  TextChat: { autoStartVoice?: boolean } | undefined;
};

export type ChatStackNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
