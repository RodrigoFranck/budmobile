import { useRef, useEffect, useCallback } from 'react';
import { FlatList, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { ChatMessage } from './ChatMessage';
import { SafetyCard } from './SafetyCard';
import { isSafetyResponse } from '@/utils/safetyDetection';
import type { Message } from '@/types/messages';
import { Typography, Spacing, InputHeight } from '@/constants/styles';
import { ChatConstants } from '@/constants/layout';

interface ChatContainerProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatContainer({ messages, loading }: ChatContainerProps) {
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  // MessageInputBar height: paddingTop + input height + paddingBottom
  const inputBarHeight = Spacing.base + InputHeight.md + Math.max(insets.bottom, Spacing.base);

  // Otimizar scroll - usar requestAnimationFrame ao invés de setTimeout
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]); // Só depender do length, não do array inteiro

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    // Check for safety response
    if (item.role === 'assistant' && isSafetyResponse(item.content)) {
      return (
        <View>
          <ChatMessage {...item} />
          <SafetyCard />
        </View>
      );
    }

    return <ChatMessage {...item} />;
  }, []);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id || `msg-${item.role}-${item.content.slice(0, 10)}`}
      style={{ flex: 1 }}
      contentContainerStyle={{ 
        paddingHorizontal: Spacing.base, 
        paddingTop: headerHeight + Spacing.base,
        paddingBottom: inputBarHeight + Spacing.base,
      }}
      onContentSizeChange={() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      }}
      ListFooterComponent={
        loading ? (
          <View style={{ padding: Spacing.base }}>
            <Text 
              className="text-muted-foreground italic"
              style={{ fontSize: Typography.base }}
            >
              Bud está digitando...
            </Text>
          </View>
        ) : null
      }
    />
  );
}

