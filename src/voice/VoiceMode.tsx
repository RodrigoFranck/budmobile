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
import { ChevronLeft, Keyboard, MicOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/lib/colors';
import { createVoiceModeStyles } from '@/voice/VoiceMode.styles';

type VoiceUiPhase = 'ending' | 'connecting' | 'speaking' | 'listening';

interface VoiceModeProps {
  visible: boolean;
  onClose: () => void;
  onEndVoice?: () => void | Promise<void>;
  transcript?: string;
  isBudSpeaking?: boolean;
  isConnecting?: boolean;
  isSessionBusy?: boolean;
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

  return (
    <View
      style={[
        styles.activityBarsWrap,
        isConnecting && styles.activityBarsWrapConnecting,
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        phase === 'connecting'
          ? 'Conectando'
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

function getVoiceCopy(phase: VoiceUiPhase): {
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
  transcript = '',
  isBudSpeaking = false,
  isConnecting = false,
  isSessionBusy = false,
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
  const scrollRef = useRef<ScrollView>(null);
  const heroPulse = useRef(new Animated.Value(1)).current;

  const isLocked = isSessionBusy || isConnecting || isEnding;

  const phase: VoiceUiPhase = isEnding
    ? 'ending'
    : isConnecting
      ? 'connecting'
      : isBudSpeaking
        ? 'speaking'
        : 'listening';

  const copy = getVoiceCopy(phase);

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
    const words = transcript.trim().split(/\s+/);
    let currentIndex = 1;
    // Reveal the first word immediately so we never blank the center.
    setDisplayedText(words[0] ?? '');
    if (words.length <= 1) return;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
        currentIndex += 1;
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [transcript]);

  useEffect(() => {
    if (!displayedText) return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [displayedText]);

  const actionButtonStyle = isLocked
    ? [styles.actionButton, styles.actionButtonDisabled]
    : styles.actionButton;
  const backButtonStyle = isLocked
    ? [styles.backButton, styles.actionButtonDisabled]
    : styles.backButton;

  // Hero ("Pode falar" / connecting) only before the first transcript.
  // Once conversation starts, keep the transcript visible — including turn changes.
  const showTranscript =
    hasConversationStarted &&
    Boolean(displayedText) &&
    phase !== 'connecting' &&
    phase !== 'ending';
  const showHero = !showTranscript;

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              {phase === 'listening' || phase === 'connecting' ? (
                <Text style={styles.heroHint}>{copy.hint}</Text>
              ) : null}
            </Animated.View>
          ) : null}

          {showTranscript ? (
            <Text style={styles.transcript}>{displayedText}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <Text
            style={styles.status}
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {copy.status}
          </Text>
          {phase === 'speaking' ||
          phase === 'ending' ||
          (phase === 'listening' && showTranscript) ? (
            <Text style={styles.statusHint}>{copy.hint}</Text>
          ) : (
            <View style={styles.statusHintSpacer} />
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel="Encerrar microfone"
              accessibilityState={{ disabled: isLocked }}
              style={actionButtonStyle}
            >
              <MicOff size={22} color={colors['chat-body']} strokeWidth={2} />
            </TouchableOpacity>

            <VoiceActivityBars styles={styles} phase={phase} />

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao teclado"
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
