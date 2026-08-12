import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type ChatStackParamList = {
  TextChat: { autoStartVoice?: boolean } | undefined;
};

export type ChatStackNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
