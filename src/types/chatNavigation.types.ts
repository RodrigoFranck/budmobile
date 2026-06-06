import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type ChatStackParamList = {
  ChatHome: undefined;
  TextChat: undefined;
};

export type ChatStackNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
