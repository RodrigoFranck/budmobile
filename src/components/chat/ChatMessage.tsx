import { memo } from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { Typography } from '@/constants/styles';
import { useAppColors } from '@/lib/colors';
import type { MessageRole } from '@/types/messages';
import { frauncesFont } from '@/constants/onboardingTheme';
import { createChatMessageStyles } from '@/components/chat/ChatMessage.styles';

const SERIF = frauncesFont;

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  const colors = useAppColors();
  const styles = createChatMessageStyles({ colors });
  const isUser = role === 'user';
  const isContext = role === 'context';

  if (isContext) {
    return (
      <View className="my-4 px-2">
        <Text
          className="text-center italic text-muted-foreground"
          style={styles.contextText}
        >
          {content}
        </Text>
      </View>
    );
  }

  if (isStreaming && !content.trim()) {
    return null;
  }

  return (
    <View
      className={cn('mb-8 w-full', isUser ? 'items-end' : 'items-start')}
    >
      <Text style={styles.label}>
        {isUser ? 'Você' : 'Bud.'}
      </Text>
      <Text
        style={[styles.body, { textAlign: isUser ? 'right' : 'left' }]}
      >
        {content}
        {isStreaming ? <Text style={styles.streamingCursor}>▋</Text> : null}
      </Text>
    </View>
  );
});
