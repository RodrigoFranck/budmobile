import { useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
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
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      style={{ flex: 1 }}
      contentContainerStyle={{ 
        paddingHorizontal: Spacing.base, 
        paddingTop: headerHeight + Spacing.base,
        paddingBottom: inputBarHeight + Spacing.base,
      }}
      onContentSizeChange={() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
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

