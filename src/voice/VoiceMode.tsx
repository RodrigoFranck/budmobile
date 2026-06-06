import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, Keyboard, MicOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/lib/colors';
import type { AppColors } from '@/lib/colors';
import { createVoiceModeStyles } from '@/voice/VoiceMode.styles';

interface VoiceModeProps {
  visible: boolean;
  onClose: () => void;
  onEndVoice?: () => void;
  transcript?: string;
  isBudSpeaking?: boolean;
  isConnecting?: boolean;
}

function VoiceActivityBars({
  colors,
  styles,
}: {
  colors: AppColors;
  styles: ReturnType<typeof createVoiceModeStyles>;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scales = [0.42, 0.72, 1, 0.55, 0.85];

  return (
    <View style={styles.activityBarsWrap}>
      {scales.map((base, i) => {
        const scaleY = pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35 + base * 0.25, 0.55 + base * 0.45],
        });
        return (
          <Animated.View
            key={i}
            style={[styles.activityBar, { transform: [{ scaleY }] }]}
          />
        );
      })}
    </View>
  );
}

export function VoiceMode({
  visible,
  onClose,
  onEndVoice,
  transcript = '',
  isBudSpeaking = false,
  isConnecting = false,
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

  const handleClose = () => {
    onEndVoice?.();
    onClose();
  };

  useEffect(() => {
    if (!transcript) {
      setDisplayedText('');
      return;
    }
    const words = transcript.split(' ');
    let currentIndex = 0;
    setDisplayedText('');
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

  const statusLabel = isConnecting
    ? 'Bud está conectando...'
    : isBudSpeaking
      ? 'Bud está falando'
      : 'Bud está ouvindo...';

  const transcriptPlaceholder = isConnecting ? 'Conectando…' : 'Ouvindo…';

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
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
        >
          <ChevronLeft size={20} color={colors.foreground} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.main}>
          <Text style={styles.transcript}>
            {displayedText || transcriptPlaceholder}
          </Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.status}>{statusLabel}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Encerrar microfone"
              style={styles.actionButton}
            >
              <MicOff size={22} color={colors.foreground} strokeWidth={2} />
            </TouchableOpacity>

            <VoiceActivityBars colors={colors} styles={styles} />

            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao teclado"
              style={styles.actionButton}
            >
              <Keyboard size={22} color={colors.foreground} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
