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
import { ChevronLeft, Keyboard, Mic, MicOff, Pause, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/lib/colors';
import { createVoiceModeStyles } from '@/voice/VoiceMode.styles';
import {
  joinTranscriptTokens,
  tokenizeTranscriptPreservingBreaks,
} from '@/voice/voiceTranscript';

type VoiceUiPhase = 'ending' | 'connecting' | 'speaking' | 'listening' | 'paused';

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

function VoiceActivityBars({
  styles,
  phase,
}: {
  styles: ReturnType<typeof createVoiceModeStyles>;
  phase: VoiceUiPhase;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = phase === 'connecting' ? 420 : phase === 'speaking' ? 380 : 650;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const scales = [0.38, 0.62, 1, 0.62, 0.38];
  const isActive = phase === 'speaking' || phase === 'listening';
  const isConnecting = phase === 'connecting';
  const isPaused = phase === 'paused';

  return (
    <View
      style={[
        styles.activityBarsWrap,
        isConnecting && styles.activityBarsWrapConnecting,
        isPaused && styles.activityBarsWrapPaused,
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        phase === 'connecting'
          ? 'Conectando'
          : phase === 'paused'
            ? 'Conversa pausada'
            : phase === 'speaking'
              ? 'Bud falando'
              : 'Pronto para ouvir'
      }
    >
      <View style={styles.activityBarsInner}>
        {scales.map((base, i) => {
          const idleFloor = isActive ? 0.35 : 0.2;
          const scaleY = pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [
              idleFloor + base * 0.2,
              (isConnecting ? 0.45 : 0.55) + base * (isActive ? 0.45 : 0.3),
            ],
          });
          return (
            <Animated.View
              key={i}
              style={[styles.activityBar, { transform: [{ scaleY }] }]}
            />
          );
        })}
      </View>
    </View>
  );
}

function getVoiceCopy(
  phase: VoiceUiPhase,
  isMicMuted: boolean,
): {
  hero: string;
  status: string;
  hint: string;
} {
  if (phase === 'ending') {
    return {
      hero: 'Encerrando…',
      status: 'Encerrando conexão',
      hint: 'Aguarde um instante',
    };
  }
  if (phase === 'connecting') {
    return {
      hero: 'Conectando…',
      status: 'Bud está conectando',
      hint: 'Aguarde — em seguida você poderá falar',
    };
  }
  if (phase === 'paused') {
    return {
      hero: 'Pausado',
      status: 'Conversa pausada',
      hint: 'Pense com calma e toque em retomar quando quiser',
    };
  }
  if (isMicMuted) {
    return {
      hero: phase === 'speaking' ? '' : 'Microfone silenciado',
      status: 'Microfone silenciado',
      hint:
        phase === 'speaking'
          ? 'Escute com atenção; o microfone continua desligado'
          : 'Toque no microfone para voltar a falar',
    };
  }
  if (phase === 'speaking') {
    return {
      hero: '',
      status: 'Bud está falando',
      hint: 'Escute com atenção; depois será sua vez',
    };
  }
  return {
    hero: 'Pode falar',
    status: 'Bud está ouvindo',
    hint: 'Fale com naturalidade, em tom normal',
  };
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
  const colors = useAppColors();
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
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const heroPulse = useRef(new Animated.Value(1)).current;
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
          : 'listening';

  const copy = getVoiceCopy(phase, isMicMuted);

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
      setHasConversationStarted(false);
      setDisplayedText('');
    }
  }, [visible]);

  useEffect(() => {
    if (phase !== 'connecting') {
      heroPulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroPulse, phase]);

  useEffect(() => {
    if (!transcript.trim()) {
      // Keep the last transcript on screen between turns — never flash the hero.
      return;
    }

    setHasConversationStarted(true);
    const tokens = tokenizeTranscriptPreservingBreaks(transcript);
    let currentIndex = 1;
    // Reveal the first word immediately so we never blank the center.
    setDisplayedText(joinTranscriptTokens(tokens.slice(0, 1)));
    if (tokens.length <= 1) return;

    const interval = setInterval(() => {
      if (currentIndex < tokens.length) {
        setDisplayedText(joinTranscriptTokens(tokens.slice(0, currentIndex + 1)));
        currentIndex += 1;
      } else {
        clearInterval(interval);
      }
    }, 150);
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

  const actionButtonStyle = isLocked
    ? [styles.actionButton, styles.actionButtonDisabled]
    : styles.actionButton;
  const backButtonStyle = isLocked
    ? [styles.backButton, styles.actionButtonDisabled]
    : styles.backButton;

  // Hero ("Pode falar" / connecting / paused) only before the first transcript.
  // Once conversation starts, keep the transcript visible — including turn changes.
  const showTranscript =
    hasConversationStarted &&
    Boolean(displayedText) &&
    phase !== 'connecting' &&
    phase !== 'ending';
  const showHero = !showTranscript;
  // Mute copy lives in the hero when it is on screen; avoid repeating it in the footer.
  const muteCopyInHero = showHero && isMicMuted && Boolean(copy.hero);
  const showFooterStatus = !muteCopyInHero;
  const showFooterHint =
    !muteCopyInHero &&
    (phase === 'speaking' ||
      phase === 'ending' ||
      phase === 'paused' ||
      isMicMuted ||
      (phase === 'listening' && showTranscript));
  const canTogglePause = !isLocked && Boolean(onTogglePause);
  const canToggleMute = !isLocked && !isPaused && Boolean(onToggleMute);
  const muteIconColor = isMicMuted ? colors.destructive : colors['chat-body'];

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
        <TouchableOpacity
          onPress={handleClose}
          disabled={isLocked}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityState={{ disabled: isLocked }}
          style={backButtonStyle}
        >
          <ChevronLeft size={20} color={colors['chat-body']} strokeWidth={2} />
        </TouchableOpacity>

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
          {showHero && copy.hero ? (
            <Animated.View
              style={[
                styles.heroBlock,
                { opacity: phase === 'connecting' ? heroPulse : 1 },
              ]}
            >
              <Text
                style={[
                  styles.heroLabel,
                  phase === 'connecting' && styles.heroLabelConnecting,
                ]}
                accessibilityRole="header"
              >
                {copy.hero}
              </Text>
              {phase === 'listening' ||
              phase === 'connecting' ||
              phase === 'paused' ? (
                <Text style={styles.heroHint}>{copy.hint}</Text>
              ) : null}
            </Animated.View>
          ) : null}

          {showTranscript ? (
            <View style={styles.transcriptBlock}>
              {displayedText
                .split(/\n+/)
                .filter((stanza) => stanza.length > 0)
                .map((stanza, index) => (
                  <Text
                    key={`stanza-${index}`}
                    style={[
                      styles.transcript,
                      index > 0 && styles.transcriptStanza,
                    ]}
                  >
                    {stanza}
                  </Text>
                ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          {showFooterStatus ? (
            <Text
              style={styles.status}
              accessibilityLiveRegion="polite"
              accessibilityRole="text"
            >
              {copy.status}
            </Text>
          ) : null}
          {showFooterHint ? (
            <Text style={styles.statusHint}>{copy.hint}</Text>
          ) : (
            <View style={styles.statusHintSpacer} />
          )}
          <View style={styles.actionsRow}>
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
              style={
                !canToggleMute
                  ? [styles.actionButton, styles.actionButtonDisabled]
                  : isMicMuted
                    ? [styles.actionButton, styles.actionButtonMuted]
                    : styles.actionButton
              }
            >
              {isMicMuted ? (
                <MicOff size={22} color={muteIconColor} strokeWidth={2} />
              ) : (
                <Mic size={22} color={muteIconColor} strokeWidth={2} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePause}
              disabled={!canTogglePause}
              accessibilityRole="button"
              accessibilityLabel={isPaused ? 'Retomar conversa' : 'Pausar conversa'}
              accessibilityState={{ disabled: !canTogglePause, selected: isPaused }}
              style={!canTogglePause ? styles.actionButtonDisabled : undefined}
            >
              {phase === 'connecting' || phase === 'ending' ? (
                <VoiceActivityBars styles={styles} phase={phase} />
              ) : isPaused ? (
                <View style={[styles.activityBarsWrap, styles.activityBarsWrapPaused]}>
                  <Play
                    size={26}
                    color={colors['chat-warm-bg']}
                    strokeWidth={2}
                    fill={colors['chat-warm-bg']}
                  />
                </View>
              ) : (
                <View style={styles.activityBarsWrap}>
                  <Pause
                    size={26}
                    color={colors['chat-warm-bg']}
                    strokeWidth={2}
                    fill={colors['chat-warm-bg']}
                  />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel="Encerrar voz e voltar ao teclado"
              accessibilityState={{ disabled: isLocked }}
              style={actionButtonStyle}
            >
              <Keyboard size={22} color={colors['chat-body']} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
