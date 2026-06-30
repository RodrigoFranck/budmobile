import { useRef, useEffect, useCallback, useMemo } from 'react';
import { FlatList, Keyboard, View, Text } from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { SafetyCard } from './SafetyCard';
import { isSafetyResponse } from '@/utils/safetyDetection';
import type { Message } from '@/types/messages';
import { Spacing } from '@/constants/styles';
import { useAppColors } from '@/lib/colors';
import { createChatContainerStyles } from '@/components/chat/ChatContainer.styles';

const SCROLL_SETTLE_MS = 80;

interface ChatContainerProps {
  messages: Message[];
  loading?: boolean;
  topPadding?: number;
  scrollResetToken?: number;
  onAssistantRevealComplete?: (messageId: string | number) => void;
}

type ListItem =
  | { kind: 'divider'; id: string; label: string }
  | { kind: 'message'; id: string; message: Message };

function capitalizePt(s: string) {
  if (!s.length) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildListItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDay: Date | null = null;

  for (const msg of messages) {
    const d = msg.createdAt ? parseISO(msg.createdAt) : new Date();
    if (!lastDay || !isSameDay(d, lastDay)) {
      const raw = format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
      items.push({
        kind: 'divider',
        id: `div-${msg.id}-${d.toISOString()}`,
        label: capitalizePt(raw),
      });
      lastDay = d;
    }
    items.push({ kind: 'message', id: String(msg.id), message: msg });
  }

  return items;
}

function ChatEmptyPrompt() {
  const colors = useAppColors();
  const label = useMemo(() => {
    const raw = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
    return capitalizePt(raw);
  }, []);

  const styles = useMemo(
    () =>
      createChatContainerStyles({ colors, topPadding: 0 }),
    [colors],
  );

  return (
    <View
      className="flex-1 justify-center px-8"
      style={styles.emptyPrompt}
    >
      <Text style={[styles.dateDividerText, { textAlign: 'center' }]}>
        {label}
      </Text>
      <Text style={styles.emptyTitle}>O que você tem em mente?</Text>
    </View>
  );
}

function DateDivider({ label }: { label: string }) {
  const colors = useAppColors();
  const styles = useMemo(
    () =>
      createChatContainerStyles({ colors, topPadding: 0 }),
    [colors],
  );
  return (
    <View className="mb-6 mt-2 items-center">
      <Text style={styles.dateDividerText}>{label}</Text>
    </View>
  );
}

export function ChatContainer({
  messages,
  loading,
  topPadding,
  scrollResetToken,
  onAssistantRevealComplete,
}: ChatContainerProps) {
  const colors = useAppColors();
  const flatListRef = useRef<FlatList>(null);
  const isNearBottomRef = useRef(true);
  const previousListLengthRef = useRef(0);
  const previousLastMessageIdRef = useRef<string | number | null>(null);
  const wasRevealingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = useMemo(
    () =>
      createChatContainerStyles({
        colors,
        topPadding: topPadding ?? Spacing.base,
      }),
    [colors, topPadding],
  );

  const listItems = useMemo(() => buildListItems(messages), [messages]);
  const isInverted = listItems.length > 0;
  const displayItems = useMemo(
    () => (isInverted ? [...listItems].reverse() : listItems),
    [isInverted, listItems],
  );

  const showTypingFooter = useMemo(() => {
    if (messages.length === 0) {
      return false;
    }

    return messages.some(
      (msg) => msg.role === 'assistant' && msg.isStreaming,
    );
  }, [messages]);

  const scrollToLatest = useCallback((animated = true) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        if (isInverted) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated });
          return;
        }
        flatListRef.current?.scrollToEnd({ animated });
      });
    }, SCROLL_SETTLE_MS);
  }, [isInverted]);

  const handleMessageContentGrowth = useCallback(() => {
    if (!isNearBottomRef.current) {
      return;
    }
    scrollToLatest(true);
  }, [scrollToLatest]);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      if (isInverted) {
        isNearBottomRef.current = contentOffset.y < 80;
        return;
      }

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottomRef.current = distanceFromBottom < 80;
    },
    [isInverted],
  );

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return;
    }

    const isNewMessage = lastMessage.id !== previousLastMessageIdRef.current;
    previousLastMessageIdRef.current = lastMessage.id;

    if (!isNewMessage || !isNearBottomRef.current) {
      return;
    }

    scrollToLatest(true);
  }, [messages, scrollToLatest]);

  useEffect(() => {
    const isRevealing = messages.some(
      (msg) => msg.role === 'assistant' && msg.isRevealing,
    );

    if (isRevealing && !wasRevealingRef.current && isNearBottomRef.current) {
      scrollToLatest(true);
    }

    wasRevealingRef.current = isRevealing;
  }, [messages, scrollToLatest]);

  useEffect(() => {
    if (!showTypingFooter || !isNearBottomRef.current) {
      return;
    }

    scrollToLatest(true);
  }, [showTypingFooter, scrollToLatest]);

  useEffect(() => {
    if (listItems.length > 0 && previousListLengthRef.current === 0) {
      isNearBottomRef.current = true;
      scrollToLatest(false);
    }
    previousListLengthRef.current = listItems.length;
  }, [listItems.length, scrollToLatest]);

  useEffect(() => {
    if (!scrollResetToken) return;

    isNearBottomRef.current = true;
    scrollToLatest(false);
  }, [scrollResetToken, scrollToLatest]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollToLatest(true);
    });

    return () => {
      showSubscription.remove();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollToLatest]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'divider') {
        return <DateDivider label={item.label} />;
      }

      const msg = item.message;
      const chatMessage = (
        <ChatMessage
          role={msg.role}
          content={msg.content}
          isStreaming={msg.isStreaming}
          isRevealing={msg.isRevealing}
          messageId={msg.id}
          onRevealComplete={onAssistantRevealComplete}
          onContentGrowth={handleMessageContentGrowth}
        />
      );

      if (msg.role === 'assistant' && isSafetyResponse(msg.content)) {
        return (
          <View>
            {chatMessage}
            <SafetyCard />
          </View>
        );
      }

      return chatMessage;
    },
    [handleMessageContentGrowth, onAssistantRevealComplete],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const showEmpty = messages.length === 0 && !loading;

  const typingIndicator = useMemo(() => (
    showTypingFooter ? (
      <View style={styles.footerWrap}>
        <TypingIndicator />
      </View>
    ) : null
  ), [showTypingFooter, styles.footerWrap]);

  return (
    <FlatList
      ref={flatListRef}
      data={displayItems}
      inverted={isInverted}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={[
        styles.contentContainer,
        !isInverted && styles.contentContainerAnchored,
      ]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      maintainVisibleContentPosition={
        isInverted ? { minIndexForVisible: 0 } : undefined
      }
      ListEmptyComponent={showEmpty ? <ChatEmptyPrompt /> : null}
      ListHeaderComponent={isInverted ? typingIndicator : null}
      ListFooterComponent={isInverted ? null : typingIndicator}
    />
  );
}
