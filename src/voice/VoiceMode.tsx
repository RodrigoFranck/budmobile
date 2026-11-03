import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Keyboard,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudIconButton } from '@/components/v3';
import { useV3Colors } from '@/theme';
import { createVoiceModeStyles } from '@/voice/VoiceMode.styles';
import {
  joinTranscriptTokens,
  tokenizeTranscriptPreservingBreaks,
} from '@/voice/voiceTranscript';

type VoiceUiPhase =
  | 'ending'
  | 'connecting'
  | 'speaking'
  | 'listening'
  | 'paused'
  | 'thinking';

interface VoiceModeProps {
  visible: boolean;
  onClose: () => void;
  onEndVoice?: () => void | Promise<void>;
  onTogglePause?: () => void;
  onToggleMute?: () => void;
  transcript?: string;
  isBudSpeaking?: boolean;
  isConnecting?: boolean;
  isSessionBusy?: boolean;
  isPaused?: boolean;
  isMicMuted?: boolean;
}

function getStatusLabel(phase: VoiceUiPhase, isMicMuted: boolean): string {
  if (phase === 'ending') return 'Encerrando…';
  if (phase === 'connecting') return 'Conectando…';
  if (phase === 'paused') return 'Pausado';
  if (phase === 'thinking') return 'Pensando…';
  if (phase === 'speaking') return 'Bud falando';
  if (isMicMuted) return 'Pode falar';
  return phase === 'listening' ? 'Ouvindo' : 'Pode falar';
}

function TranscriptText({
  text,
  styles,
}: {
  text: string;
  styles: ReturnType<typeof createVoiceModeStyles>;
}) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const accentIndex = words.length > 3 ? words.length - 2 : -1;

  return (
    <Text style={styles.transcript}>
      {words.map((word, index) => {
        const isAccent = index === accentIndex;
        const suffix = index < words.length - 1 ? ' ' : '';
        if (isAccent) {
          return (
            <Text key={`${word}-${index}`} style={styles.transcriptAccent}>
              {word}
              {suffix}
            </Text>
          );
        }
        return (
          <Text key={`${word}-${index}`}>
            {word}
            {suffix}
          </Text>
        );
      })}
    </Text>
  );
}

export function VoiceMode({
  visible,
  onClose,
  onEndVoice,
  onTogglePause,
  onToggleMute,
  transcript = '',
  isBudSpeaking = false,
  isConnecting = false,
  isSessionBusy = false,
  isPaused = false,
  isMicMuted = false,
}: VoiceModeProps) {
  const colors = useV3Colors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () =>
      createVoiceModeStyles({
        colors,
        topInset: insets.top,
        bottomInset: insets.bottom,
      }),
    [colors, insets.bottom, insets.top],
  );
  const [displayedText, setDisplayedText] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const contentFits =
    scrollViewHeight === 0 || contentHeight <= scrollViewHeight + 1;

  const isLocked = isSessionBusy || isConnecting || isEnding;

  const phase: VoiceUiPhase = isEnding
    ? 'ending'
    : isConnecting
      ? 'connecting'
      : isPaused
        ? 'paused'
        : isBudSpeaking
          ? 'speaking'
          : transcript.trim() && !isBudSpeaking
            ? 'listening'
            : 'listening';

  const statusLabel = getStatusLabel(phase, isMicMuted);

  const handleClose = async () => {
    if (isLocked) return;

    setIsEnding(true);
    try {
      await onEndVoice?.();
    } finally {
      setIsEnding(false);
      onClose();
    }
  };

  const handleTogglePause = () => {
    if (isLocked) return;
    onTogglePause?.();
  };

  const handleToggleMute = () => {
    if (isLocked || isPaused) return;
    onToggleMute?.();
  };

  useEffect(() => {
    if (!visible) {
      setIsEnding(false);
      setDisplayedText('');
    }
  }, [visible]);

  useEffect(() => {
    labelOpacity.setValue(0);
    Animated.timing(labelOpacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [labelOpacity, statusLabel]);

  useEffect(() => {
    if (!transcript.trim()) {
      return;
    }

    const tokens = tokenizeTranscriptPreservingBreaks(transcript);
    let currentIndex = 1;
    setDisplayedText(joinTranscriptTokens(tokens.slice(0, 1)));
    if (tokens.length <= 1) return;

    const interval = setInterval(() => {
      if (currentIndex < tokens.length) {
        setDisplayedText(joinTranscriptTokens(tokens.slice(0, currentIndex + 1)));
        currentIndex += 1;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [transcript]);

  const scrollTranscriptToEnd = () => {
    if (!displayedText) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    scrollTranscriptToEnd();
  }, [displayedText]);

  const canTogglePause = !isLocked && Boolean(onTogglePause);
  const canToggleMute = !isLocked && !isPaused && Boolean(onToggleMute);
  const muteIconColor = isMicMuted ? '#C45C4A' : colors.text;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BudIconButton
            icon={ChevronLeft}
            accessibilityLabel="Voltar"
            onPress={handleClose}
            disabled={isLocked}
          />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.main}
          contentContainerStyle={[
            styles.scrollContent,
            !contentFits && styles.scrollContentOverflow,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => {
            setScrollViewHeight(event.nativeEvent.layout.height);
          }}
          onContentSizeChange={(_, height) => {
            setContentHeight(height);
            scrollTranscriptToEnd();
          }}
        >
          <Animated.Text
            style={[styles.statusLabel, { opacity: labelOpacity }]}
            accessibilityLiveRegion="polite"
          >
            {statusLabel}
          </Animated.Text>

          {displayedText ? (
            <TouchableOpacity
              activeOpacity={canTogglePause ? 0.85 : 1}
              onPress={phase === 'paused' || canTogglePause ? handleTogglePause : undefined}
              accessibilityRole={canTogglePause ? 'button' : undefined}
              accessibilityLabel={
                phase === 'paused' ? 'Retomar conversa' : 'Pausar conversa'
              }
              style={styles.transcriptPressable}
            >
              <View style={styles.transcriptBlock}>
                {displayedText
                  .split(/\n+/)
                  .filter((stanza) => stanza.length > 0)
                  .map((stanza, index) => (
                    <View
                      key={`stanza-${index}`}
                      style={[
                        styles.transcriptStanzaWrap,
                        index > 0 ? styles.transcriptStanza : null,
                      ]}
                    >
                      <TranscriptText text={stanza} styles={styles} />
                    </View>
                  ))}
              </View>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity
            onPress={handleTogglePause}
            disabled={!canTogglePause}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Retomar áudio' : 'Pausar áudio'}
            accessibilityState={{ disabled: !canTogglePause, selected: isPaused }}
            style={[
              styles.circleButton,
              !canTogglePause && styles.circleButtonDisabled,
            ]}
          >
            {isPaused ? (
              <VolumeX size={22} color={colors.text} strokeWidth={2} />
            ) : (
              <Volume2 size={22} color={colors.text} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleMute}
            disabled={!canToggleMute}
            accessibilityRole="button"
            accessibilityLabel={
              isMicMuted ? 'Ativar microfone' : 'Silenciar microfone'
            }
            accessibilityState={{
              disabled: !canToggleMute,
              selected: isMicMuted,
            }}
            style={[
              styles.circleButton,
              !canToggleMute && styles.circleButtonDisabled,
              isMicMuted && styles.circleButtonMuted,
            ]}
          >
            {isMicMuted ? (
              <MicOff size={22} color={muteIconColor} strokeWidth={2} />
            ) : (
              <Mic size={22} color={muteIconColor} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClose}
            disabled={isLocked}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao teclado"
            accessibilityState={{ disabled: isLocked }}
            style={[styles.circleButton, isLocked && styles.circleButtonDisabled]}
          >
            <Keyboard size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.endWrap}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel="Encerrar voz"
              accessibilityState={{ disabled: isLocked }}
              style={[styles.endButton, isLocked && styles.circleButtonDisabled]}
            >
              <Text style={styles.endLabel}>Encerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
