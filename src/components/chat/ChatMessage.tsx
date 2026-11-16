import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import { useStaggeredReveal, STANZA_FADE_MS } from '@/hooks/useStaggeredReveal';
import { splitMessageStanzas } from '@/utils/splitMessageStanzas';
import { parseInsightContextMessage } from '@/utils/insightContextMessage';
import { createChatMessageStyles } from '@/components/chat/ChatMessage.styles';
import { InsightContextCard } from '@/components/chat/InsightContextCard';
import { ChatPhoto } from '@/components/chat/ChatPhoto';
import { parseChatImageContent } from '@/utils/chatImageMessage';
import { useV3Colors } from '@/theme';
import type { MessageRole } from '@/types/messages';

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  imageUri?: string;
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
    <View style={styles.messageContent}>
      {stanzas.slice(0, visibleCount).map((stanza, index) => (
        <StanzaBlock
          key={`${index}-${stanza.slice(0, 24)}`}
          text={stanza}
          style={styles.assistantBody}
          spacingStyle={index > 0 ? styles.stanzaSpacing : undefined}
          animate={enabled}
        />
      ))}
    </View>
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
  imageUri,
  isStreaming,
  isRevealing,
  messageId,
  onRevealComplete,
  onContentGrowth,
}: ChatMessageProps) {
  const colors = useV3Colors();
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
    const contextCard = parseInsightContextMessage(content);
    if (contextCard) {
      return (
        <InsightContextCard
          badge={contextCard.badge}
          title={contextCard.title}
          description={contextCard.description}
          variant={contextCard.variant}
          activityType={contextCard.activityType}
        />
      );
    }

    return (
      <View style={{ marginVertical: 16, paddingHorizontal: 8 }}>
        <Text style={[styles.contextText, { textAlign: 'center' }]}>{content}</Text>
      </View>
    );
  }

  if (isAssistantStreaming) {
    return null;
  }

  if (isUser) {
    const storagePath = parseChatImageContent(content)?.storagePath ?? null;
    const inlineUri = content.startsWith('data:image/') ? content : null;
    const photoUri = imageUri ?? inlineUri;
    if (photoUri || storagePath) {
      return (
        <MessageEntrance>
          <View style={styles.userWrap}>
            <View style={styles.userPhotoBubble}>
              <ChatPhoto
                uri={photoUri}
                storagePath={photoUri ? null : storagePath}
                style={styles.userPhoto}
              />
            </View>
          </View>
        </MessageEntrance>
      );
    }

    return (
      <MessageEntrance>
        <View style={styles.userWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userBody}>{content}</Text>
          </View>
        </View>
      </MessageEntrance>
    );
  }

  return (
    <View style={styles.assistantWrap}>
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
        <View style={styles.messageContent}>
          <Text style={styles.assistantBody}>{content}</Text>
        </View>
      )}
    </View>
  );
});
