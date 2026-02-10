import { memo } from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { Typography } from '@/constants/styles';
import type { MessageRole } from '@/types/messages';

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const isContext = role === 'context';

  return (
    <View
      className={cn(
        'mx-4 my-2 rounded-lg p-3',
        isUser && 'bg-chat-user ml-auto max-w-[80%]',
        !isUser && !isContext && 'bg-chat-assistant mr-auto max-w-[80%]',
        isContext && 'bg-muted max-w-full',
      )}
    >
      <Text
        className={cn(
          'text-base',
          isUser && 'text-white',
          !isUser && !isContext && 'text-foreground',
          isContext && 'text-muted-foreground italic',
        )}
        style={{ 
          fontSize: Typography.base, 
          lineHeight: Typography.lineHeight.relaxed 
        }}
      >
        {content}
        {isStreaming && <Text className="opacity-50">▋</Text>}
      </Text>
    </View>
  );
});

