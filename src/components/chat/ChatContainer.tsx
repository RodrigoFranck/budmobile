import { useRef, useEffect, useCallback, useMemo } from 'react';
import { FlatList, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatMessage } from './ChatMessage';
import { SafetyCard } from './SafetyCard';
import { isSafetyResponse } from '@/utils/safetyDetection';
import type { Message } from '@/types/messages';
import { Typography, Spacing, InputHeight } from '@/constants/styles';
import { useAppColors } from '@/lib/colors';
import { frauncesFont } from '@/constants/onboardingTheme';
import { createChatContainerStyles } from '@/components/chat/ChatContainer.styles';

const SERIF = frauncesFont;
const CHAT_DATE_FONT_SIZE = 15;

interface ChatContainerProps {
  messages: Message[];
  loading?: boolean;
  topPadding?: number;
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
      createChatContainerStyles({
        colors,
        inputBarHeight: 0,
        topPadding: 0,
      }),
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
      createChatContainerStyles({
        colors,
        inputBarHeight: 0,
        topPadding: 0,
      }),
    [colors],
  );
  return (
    <View className="mb-6 mt-2 items-center">
      <Text style={styles.dateDividerText}>{label}</Text>
    </View>
  );
}

export function ChatContainer({ messages, loading, topPadding }: ChatContainerProps) {
  const colors = useAppColors();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const inputBarHeight = Spacing.base + InputHeight.md + Math.max(insets.bottom, Spacing.base);
  const styles = useMemo(
    () =>
      createChatContainerStyles({
        colors,
        inputBarHeight,
        topPadding: topPadding ?? insets.top + Spacing.base,
      }),
    [colors, insets.top, inputBarHeight, topPadding],
  );

  const listItems = useMemo(() => buildListItems(messages), [messages]);

  useEffect(() => {
    if (listItems.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [listItems.length]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'divider') {
        return <DateDivider label={item.label} />;
      }

      const msg = item.message;
      if (msg.role === 'assistant' && isSafetyResponse(msg.content)) {
        return (
          <View>
            <ChatMessage {...msg} />
            <SafetyCard />
          </View>
        );
      }

      return <ChatMessage {...msg} />;
    },
    [],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const showEmpty = messages.length === 0 && !loading;

  return (
    <FlatList
      ref={flatListRef}
      data={listItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
      onContentSizeChange={() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      }}
      ListEmptyComponent={showEmpty ? <ChatEmptyPrompt /> : null}
      ListFooterComponent={
        loading && messages.length > 0 ? (
          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>Bud está digitando...</Text>
          </View>
        ) : null
      }
    />
  );
}
