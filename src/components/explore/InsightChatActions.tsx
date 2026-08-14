import { useMemo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowUp } from 'lucide-react-native';

import {
  createInsightChatActionsStyles,
  insightCardActionLayout,
} from '@/components/explore/InsightChatActions.styles';
import { useAppColors } from '@/lib/colors';
import { WavesIcon } from '@/voice/WavesIcon';

const DEFAULT_MESSAGE_LABEL = 'Envie uma mensagem';
const DEFAULT_VOICE_LABEL = 'Abrir modo de voz para este insight';

interface InsightChatActionsProps {
  onMessage?: () => void;
  onVoice?: () => void;
  messageLabel?: string;
  messageAccessibilityLabel?: string;
  voiceAccessibilityLabel?: string;
  messageDisabled?: boolean;
  voiceDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function InsightChatActions({
  onMessage,
  onVoice,
  messageLabel = DEFAULT_MESSAGE_LABEL,
  messageAccessibilityLabel,
  voiceAccessibilityLabel,
  messageDisabled = false,
  voiceDisabled = false,
  style,
}: InsightChatActionsProps) {
  const colors = useAppColors();
  const styles = useMemo(() => createInsightChatActionsStyles(colors), [colors]);
  const sendIconColor = `${colors['chat-warm-bg']}8C`;
  const voiceIconSize = Math.round(insightCardActionLayout.height * 0.42);

  if (!onMessage && !onVoice) {
    return null;
  }

  return (
    <View style={[styles.row, style]}>
      {onMessage ? (
        <TouchableOpacity
          onPress={onMessage}
          disabled={messageDisabled}
          accessibilityRole="button"
          accessibilityLabel={messageAccessibilityLabel || messageLabel}
          activeOpacity={0.85}
          style={[styles.messageButton, messageDisabled && styles.messageButtonDisabled]}
        >
          <Text style={styles.messageLabel} numberOfLines={1}>
            {messageLabel}
          </Text>
          <View style={styles.sendButton}>
            <ArrowUp
              size={insightCardActionLayout.sendIconSize}
              color={sendIconColor}
              strokeWidth={3}
            />
          </View>
        </TouchableOpacity>
      ) : null}

      {onVoice ? (
        <TouchableOpacity
          onPress={onVoice}
          disabled={voiceDisabled}
          accessibilityRole="button"
          accessibilityLabel={voiceAccessibilityLabel || DEFAULT_VOICE_LABEL}
          activeOpacity={0.88}
          style={[styles.voiceButton, voiceDisabled && styles.voiceButtonDisabled]}
          hitSlop={insightCardActionLayout.voiceHitSlop}
        >
          <WavesIcon size={voiceIconSize} color="#373737" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
