import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useAppColors } from '@/lib/colors';
import type { MessageRole } from '@/types/messages';
import { useStaggeredReveal, STANZA_FADE_MS } from '@/hooks/useStaggeredReveal';
import { splitMessageStanzas } from '@/utils/splitMessageStanzas';
import { createChatMessageStyles } from '@/components/chat/ChatMessage.styles';

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  isRevealing?: boolean;
  messageId?: string | number;
  onRevealComplete?: (messageId: string | number) => void;
  onContentGrowth?: () => void;
}

function StanzaBlock({
  text,
  style,
  spacingStyle,
  animate = true,
}: {
  text: string;
  style: object;
  spacingStyle?: object;
  animate?: boolean;
}) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 8 : 0)).current;

  useEffect(() => {
    if (!animate) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(8);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: STANZA_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: STANZA_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, opacity, text, translateY]);

  return (
    <Animated.View style={[spacingStyle, { alignSelf: 'stretch' }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Text style={style}>{text}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function StaggeredAssistantContent({
  content,
  styles,
  enabled,
  messageId,
  onRevealComplete,
  onContentGrowth,
}: {
  content: string;
  styles: ReturnType<typeof createChatMessageStyles>;
  enabled: boolean;
  messageId?: string | number;
  onRevealComplete?: (messageId: string | number) => void;
  onContentGrowth?: () => void;
}) {
  const stanzas = useMemo(() => splitMessageStanzas(content), [content]);
  const handleComplete = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (messageId !== undefined) {
      onRevealComplete?.(messageId);
    }
  }, [enabled, messageId, onRevealComplete]);

  const handleStep = useCallback(() => {
    onContentGrowth?.();
  }, [onContentGrowth]);

  const visibleCount = useStaggeredReveal(
    stanzas.length,
    enabled,
    handleComplete,
    handleStep,
  );

  if (enabled && visibleCount === 0) {
    return null;
  }

  return (
    <>
      {visibleCount > 0 ? (
        <Text style={[styles.label, styles.assistantLabel]}>Bud.</Text>
      ) : null}
      <View style={styles.messageContent}>
        {stanzas.slice(0, visibleCount).map((stanza, index) => (
          <StanzaBlock
            key={`${index}-${stanza.slice(0, 24)}`}
            text={stanza}
            style={styles.body}
            spacingStyle={index > 0 ? styles.stanzaSpacing : undefined}
            animate={enabled}
          />
        ))}
      </View>
    </>
  );
}

function MessageEntrance({ children }: { children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], alignSelf: 'stretch' }}>
      {children}
    </Animated.View>
  );
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming,
  isRevealing,
  messageId,
  onRevealComplete,
  onContentGrowth,
}: ChatMessageProps) {
  const colors = useAppColors();
  const styles = createChatMessageStyles({ colors });
  const isUser = role === 'user';
  const isContext = role === 'context';
  const isAssistantStreaming = !isUser && Boolean(isStreaming);
  const isAssistantRevealing = !isUser && Boolean(isRevealing);
  const useStaggeredLayoutRef = useRef(isAssistantRevealing);

  if (isAssistantRevealing) {
    useStaggeredLayoutRef.current = true;
  }

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

  if (isAssistantStreaming) {
    return null;
  }

  if (isUser) {
    return (
      <MessageEntrance>
        <View className={cn('mb-8 w-full items-end')}>
          <Text style={[styles.label, styles.userLabel]}>Você</Text>
          <View style={styles.userMessageContent}>
            <Text style={[styles.body, { textAlign: 'right' }]}>
              {content}
            </Text>
          </View>
        </View>
      </MessageEntrance>
    );
  }

  return (
    <View className={cn('mb-8 w-full items-start')}>
      {useStaggeredLayoutRef.current ? (
        <StaggeredAssistantContent
          content={content}
          styles={styles}
          enabled={isAssistantRevealing}
          messageId={messageId}
          onRevealComplete={onRevealComplete}
          onContentGrowth={onContentGrowth}
        />
      ) : (
        <>
          <Text style={[styles.label, styles.assistantLabel]}>Bud.</Text>
          <View style={styles.messageContent}>
            <Text style={[styles.body, { textAlign: 'left' }]}>
              {content}
            </Text>
          </View>
        </>
      )}
    </View>
  );
});
