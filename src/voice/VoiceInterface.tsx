import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import { MicOff } from 'lucide-react-native';
import { useConversation } from '@elevenlabs/react-native';
import { appAlert } from '@/contexts/AppAlertContext';
import { supabase } from '@/integrations/supabase/client';
import { isSafetyResponse } from '@/utils/safetyDetection';
import {
  assembleVoicePrompt,
  cloneVoiceMessages,
  createVoiceContextRefresher,
  fetchVoiceServerContext,
  type VoiceChatMessage,
} from '@/voice/voiceClinicalContext';
import type { UserContext } from '@/voice/voicePrompt';
import { useAppColors } from '@/lib/colors';
import { useVoiceSessionKeepAwake } from '@/hooks/useVoiceSessionKeepAwake';
import {
  getVoiceButtonDimensions,
  getVoiceButtonStyles,
  type VoiceAppearance,
} from '@/voice/VoiceInterface.styles';
import { ProminentVoiceButton } from '@/voice/ProminentVoiceButton';
import { WavesIcon } from '@/voice/WavesIcon';
import type { VoiceInterfaceRef, StartVoiceConversationOptions } from '@/voice/VoiceInterface.types';
import { buildVoiceSessionStartOptions, omitVoiceFirstMessage, type VoiceSessionStartOptions } from '@/voice/voiceElevenLabsSession';
import { playVoiceMuteSound } from '@/voice/voiceCallSounds';

type VoiceSessionPhase = 'idle' | 'connecting' | 'connected' | 'disconnecting';

async function releaseVoiceAudioSession() {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // ignore audio mode reset failures
  }
}

interface ElevenLabsMessage {
  source: 'user' | 'ai';
  message?: string;
  content?: string;
}

interface ElevenLabsModeChange {
  mode: 'speaking' | 'listening';
}

interface ElevenLabsConversation {
  endSession: () => Promise<void>;
  sendContextualUpdate?: (text: string) => void;
  setMicMuted?: (muted: boolean) => void;
  sendUserActivity?: () => void;
}

/** Keep agent from taking the turn on silence while the user is paused. */
const VOICE_PAUSE_ACTIVITY_INTERVAL_MS = 1500;

export interface VoiceInterfaceProps {
  appearance?: VoiceAppearance;
  prominentSize?: number;
  onTranscript?: (text: string) => void;
  onVoiceModeChange?: (active: boolean) => void;
  onConnectingChange?: (connecting: boolean) => void;
  onSessionBusyChange?: (busy: boolean) => void;
  onPausedChange?: (paused: boolean) => void;
  onMicMutedChange?: (muted: boolean) => void;
  onUserMessage?: (text: string) => void;
  onAssistantMessage?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onSafetyTriggered?: () => void;
  userContext?: UserContext;
  messageHistory?: Array<{ role: string; content: string }>;
  recentInsights?: Array<{
    insight_type: string;
    title: string;
    description: string;
  }>;
  internalProfile?: string | null;
}

export type { VoiceInterfaceRef, StartVoiceConversationOptions } from '@/voice/VoiceInterface.types';

function VoiceButtonVisual({
  appearance,
  prominentSize,
  isConnected,
  isLoading,
  onPress,
  disabled,
}: {
  appearance: VoiceAppearance;
  prominentSize?: number;
  isConnected: boolean;
  isLoading: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const colors = useAppColors();

  if (appearance === 'prominent') {
    return (
      <ProminentVoiceButton
        colors={colors}
        size={prominentSize ?? 52}
        isConnected={isConnected}
        isLoading={isLoading}
        onPress={onPress}
        disabled={disabled}
      />
    );
  }

  const { iconSize } = getVoiceButtonDimensions(appearance);
  const { button, iconColor } = getVoiceButtonStyles(
    colors,
    appearance,
    isConnected,
  );

  const showLoading = isLoading && appearance !== 'companion';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        isConnected ? 'Encerrar voz' : 'Iniciar conversa por voz'
      }
      style={button}
      activeOpacity={0.85}
    >
      {showLoading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : isConnected ? (
        <MicOff size={iconSize} color={iconColor} />
      ) : (
        <WavesIcon size={iconSize} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

function resolveVoiceFirstMessage(
  options?: StartVoiceConversationOptions,
): string | undefined {
  const firstMessage = options?.firstMessage?.trim();
  return firstMessage ? firstMessage : undefined;
}

function toVoiceSessionMessages(
  messages?: Array<{ role: string; content: string }>,
): VoiceChatMessage[] {
  return cloneVoiceMessages(
    messages?.filter((message) => message.role === 'user' || message.role === 'assistant'),
  );
}

function VoiceInterfaceNativeInner(
  {
    appearance = 'default',
    prominentSize,
    onTranscript,
    onVoiceModeChange,
    onConnectingChange,
    onSessionBusyChange,
    onPausedChange,
    onMicMutedChange,
    onUserMessage,
    onAssistantMessage,
    onAssistantTranscript,
    onSpeakingChange,
    onSafetyTriggered,
    userContext,
    messageHistory,
    recentInsights,
    internalProfile,
  }: VoiceInterfaceProps,
  ref: React.Ref<VoiceInterfaceRef>,
) {
  const [sessionPhase, setSessionPhase] = useState<VoiceSessionPhase>('idle');
  const startSessionPromiseRef = useRef<Promise<unknown> | null>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const noResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMsgAtRef = useRef<number | null>(null);
  const lastAiMsgAtRef = useRef<number | null>(null);
  const micArmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseActivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isPausedRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const statusRef = useRef<string>('idle');
  const modeRef = useRef<{ mode: 'speaking' | 'listening'; at: number }>({
    mode: 'listening',
    at: 0,
  });
  const speakingStableRef = useRef(false);
  const speakingDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSessionConfigRef = useRef<VoiceSessionStartOptions | null>(null);
  const restartGuardRef = useRef({ inFlight: false, lastAt: 0, attempts: 0 });
  const vadRef = useRef({
    sawVoice: false,
    lastAboveAt: 0,
    lastFlushAt: 0,
    mode: 'listening' as 'speaking' | 'listening',
    listeningSinceAt: 0,
  });
  const voiceSessionActiveRef = useRef(false);
  const startGenerationRef = useRef(0);
  const sessionMessagesRef = useRef<VoiceChatMessage[]>([]);
  const refreshClinicalContextRef = useRef<
    ReturnType<typeof createVoiceContextRefresher> | null
  >(null);
  const processVoiceUserTurnRef = useRef<(text: string) => void>(() => {});
  const processVoiceAssistantTurnRef = useRef<(text: string) => void>(() => {});
  const userContextRef = useRef(userContext);
  const messageHistoryRef = useRef(messageHistory);
  const recentInsightsRef = useRef(recentInsights);
  const internalProfileRef = useRef(internalProfile);
  userContextRef.current = userContext;
  messageHistoryRef.current = messageHistory;
  recentInsightsRef.current = recentInsights;
  internalProfileRef.current = internalProfile;
  const isSessionLocked =
    sessionPhase === 'connecting' || sessionPhase === 'disconnecting';

  useEffect(() => {
    onSessionBusyChange?.(isSessionLocked);
  }, [isSessionLocked, onSessionBusyChange]);

  const clearPauseKeepAlive = useCallback(() => {
    if (pauseActivityTimerRef.current) {
      clearInterval(pauseActivityTimerRef.current);
      pauseActivityTimerRef.current = null;
    }
  }, []);

  const clearPausedState = useCallback(() => {
    const wasPaused = isPausedRef.current;
    isPausedRef.current = false;
    clearPauseKeepAlive();
    if (wasPaused) {
      onPausedChange?.(false);
    }
  }, [clearPauseKeepAlive, onPausedChange]);

  const clearMicMutedState = useCallback(() => {
    const wasMuted = isMicMutedRef.current;
    isMicMutedRef.current = false;
    if (wasMuted) {
      onMicMutedChange?.(false);
    }
  }, [onMicMutedChange]);

  const unmuteMicIfAllowed = useCallback(
    (setMuted: (muted: boolean) => void) => {
      if (isPausedRef.current || isMicMutedRef.current) return;
      try {
        setMuted(false);
      } catch {
        // ignore unmute failures
      }
    },
    [],
  );

  const conversation = useConversation({
    onStatusChange: (event: { status: string }) => {
      statusRef.current = event.status;
    },
    onConnect: () => {
      // Ignore connects for instances that did not start this session. Another
      // mounted VoiceInterface must not tear down a live room (see Chat stack).
      if (!voiceSessionActiveRef.current) {
        return;
      }

      onConnectingChange?.(false);
      setSessionPhase('connected');
      setIsLoading(false);
      restartGuardRef.current = { inFlight: false, lastAt: 0, attempts: 0 };

      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
      setTimeout(() => {
        unmuteMicIfAllowed(conversation.setMuted);
      }, 600);
      let attempts = 0;
      micArmTimerRef.current = setInterval(() => {
        attempts += 1;
        if (isPausedRef.current) {
          if (micArmTimerRef.current) {
            clearInterval(micArmTimerRef.current);
            micArmTimerRef.current = null;
          }
          return;
        }
        if (!conversation.isMuted) {
          if (micArmTimerRef.current) {
            clearInterval(micArmTimerRef.current);
            micArmTimerRef.current = null;
          }
          return;
        }
        unmuteMicIfAllowed(conversation.setMuted);
        if (attempts >= 20 && micArmTimerRef.current) {
          clearInterval(micArmTimerRef.current);
          micArmTimerRef.current = null;
        }
      }, 200);
    },
    onDisconnect: () => {
      voiceSessionActiveRef.current = false;
      startSessionPromiseRef.current = null;
      clearPausedState();
      clearMicMutedState();
      onConnectingChange?.(false);
      setSessionPhase('idle');
      setIsLoading(false);
      onVoiceModeChange?.(false);
      void releaseVoiceAudioSession();
      if (noResponseTimerRef.current) {
        clearTimeout(noResponseTimerRef.current);
        noResponseTimerRef.current = null;
      }
      if (speakingDebounceTimerRef.current) {
        clearTimeout(speakingDebounceTimerRef.current);
        speakingDebounceTimerRef.current = null;
      }
      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
    },
    onMessage: (props: { message: string; source: 'user' | 'ai' }) => {
      const text = (props.message || '').trim();
      if (!text) return;
      const messageKey = `${props.source}-${text}`;
      if (processedRef.current.has(messageKey)) return;
      processedRef.current.add(messageKey);
      setTimeout(() => processedRef.current.delete(messageKey), 10000);
      if (props.source === 'user') {
        lastUserMsgAtRef.current = Date.now();
        if (noResponseTimerRef.current) {
          clearTimeout(noResponseTimerRef.current);
          noResponseTimerRef.current = null;
        }
        // If Android gets stuck listening after a couple of turns, restart the
        // session if we don't receive any AI response shortly after a user turn.
        if (Platform.OS === 'android') {
          const userAt = lastUserMsgAtRef.current;
          noResponseTimerRef.current = setTimeout(() => {
            const lastUserAt = lastUserMsgAtRef.current;
            const lastAiAt = lastAiMsgAtRef.current;
            const stillWaitingForAi =
              lastUserAt !== null &&
              lastUserAt === userAt &&
              (lastAiAt === null || lastAiAt < lastUserAt);
            if (!stillWaitingForAi) return;
            if (statusRef.current !== 'connected') return;
            if (speakingStableRef.current) return;

            const now = Date.now();
            if (modeRef.current.at && now - modeRef.current.at < 1500) return;
            const guard = restartGuardRef.current;
            if (guard.inFlight) return;
            if (now - guard.lastAt < 6000) return;
            if (guard.attempts >= 3) return;

            const cfg = lastSessionConfigRef.current;
            if (!cfg?.conversationToken) return;

            guard.inFlight = true;
            guard.lastAt = now;
            guard.attempts += 1;

            Promise.resolve()
              .then(async () => {
                try {
                  await conversation.endSession();
                } catch {
                  // session may already be ended
                }
                const sessionOptions = lastSessionConfigRef.current;
                if (!sessionOptions) return;
                await conversation.startSession(sessionOptions);
                unmuteMicIfAllowed(conversation.setMuted);
              })
              .catch(() => {})
              .finally(() => {
                restartGuardRef.current.inFlight = false;
              });
          }, 20000);
        }
        processVoiceUserTurnRef.current(text);
      }
      if (props.source === 'ai') {
        lastAiMsgAtRef.current = Date.now();
        if (noResponseTimerRef.current) {
          clearTimeout(noResponseTimerRef.current);
          noResponseTimerRef.current = null;
        }
        if (isSafetyResponse(text)) {
          onAssistantMessage?.(text);
          voiceSessionActiveRef.current = false;
          clearPausedState();
          clearMicMutedState();
          setSessionPhase('disconnecting');
          void conversation.endSession();
          onTranscript?.('');
          processedRef.current.clear();
          onSafetyTriggered?.();
          appAlert({
            title: 'Apoio disponível',
            message: 'Se precisar de ajuda, o CVV está disponível 24h pelo 188.',
          });
          return;
        }
        processVoiceAssistantTurnRef.current(text);
        onAssistantTranscript?.(text);
        // Only show assistant text in the on-screen transcript.
        onTranscript?.(text);
      }
    },
    onModeChange: (props: { mode: 'speaking' | 'listening' }) => {
      modeRef.current = { mode: props.mode, at: Date.now() };

      // Debounce mode changes on Android to prevent UI flicker and avoid
      // triggering VAD logic while the SDK flaps between modes during TTS.
      if (speakingDebounceTimerRef.current) {
        clearTimeout(speakingDebounceTimerRef.current);
        speakingDebounceTimerRef.current = null;
      }

      if (props.mode === 'speaking') {
        speakingStableRef.current = true;
        onSpeakingChange?.(true);
        vadRef.current.mode = 'speaking';
        vadRef.current.sawVoice = false;
        return;
      }

      // Delay the transition to "listening" to avoid rapid speaking/listening flips.
      speakingDebounceTimerRef.current = setTimeout(() => {
        speakingStableRef.current = false;
        onSpeakingChange?.(false);
        vadRef.current.mode = 'listening';
        // New listening turn: reset VAD state so we can detect voice again.
        vadRef.current.sawVoice = false;
        vadRef.current.lastAboveAt = 0;
        vadRef.current.listeningSinceAt = Date.now();
      }, 500);
    },
    onError: (message: string) => {
      voiceSessionActiveRef.current = false;
      startSessionPromiseRef.current = null;
      clearPausedState();
      clearMicMutedState();
      onConnectingChange?.(false);
      setSessionPhase('idle');
      setIsLoading(false);
      appAlert({ title: 'Erro', message: message || 'Erro na conexão de voz' });
      onVoiceModeChange?.(false);
      void releaseVoiceAudioSession();
    },
  });

  useEffect(() => {
    refreshClinicalContextRef.current = createVoiceContextRefresher((text) => {
      try {
        conversation.sendContextualUpdate(text);
      } catch {
        // session may not be ready yet
      }
    });
  }, [conversation]);

  useEffect(() => {
    processVoiceUserTurnRef.current = (text: string) => {
      sessionMessagesRef.current.push({ role: 'user', content: text });
      void refreshClinicalContextRef.current?.(sessionMessagesRef.current);
      onUserMessage?.(text);
    };
    processVoiceAssistantTurnRef.current = (text: string) => {
      sessionMessagesRef.current.push({ role: 'assistant', content: text });
      onAssistantMessage?.(text);
    };
  }, [onAssistantMessage, onUserMessage]);

  useEffect(() => {
    return () => {
      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
      clearPauseKeepAlive();
    };
  }, [clearPauseKeepAlive]);

  const [isLoading, setIsLoading] = useState(false);

  const setPaused = useCallback(
    (paused: boolean) => {
      if (sessionPhase !== 'connected') return;
      if (isPausedRef.current === paused) return;

      isPausedRef.current = paused;
      onPausedChange?.(paused);

      if (paused) {
        try {
          conversation.setMuted(true);
        } catch {
          // ignore mute failures while pausing
        }
        try {
          conversation.sendUserActivity();
        } catch {
          // ignore activity signal failures
        }
        clearPauseKeepAlive();
        pauseActivityTimerRef.current = setInterval(() => {
          try {
            conversation.sendUserActivity();
          } catch {
            // ignore activity signal failures while paused
          }
        }, VOICE_PAUSE_ACTIVITY_INTERVAL_MS);
        return;
      }

      clearPauseKeepAlive();
      try {
        conversation.setMuted(isMicMutedRef.current);
      } catch {
        // ignore mic restore failures while resuming
      }
    },
    [clearPauseKeepAlive, conversation, onPausedChange, sessionPhase],
  );

  const setMicMuted = useCallback(
    (muted: boolean) => {
      if (sessionPhase !== 'connected') return;
      if (isMicMutedRef.current === muted) return;

      isMicMutedRef.current = muted;
      onMicMutedChange?.(muted);
      playVoiceMuteSound(muted);

      // While paused the mic stays muted regardless; mute preference is restored on resume.
      if (isPausedRef.current) return;

      try {
        conversation.setMuted(muted);
      } catch {
        // ignore mute failures
      }
    },
    [conversation, onMicMutedChange, sessionPhase],
  );

  const endConversation = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    if (!force && (sessionPhase === 'connecting' || sessionPhase === 'disconnecting')) {
      return;
    }
    if (!force && sessionPhase !== 'connected') {
      return;
    }

    startGenerationRef.current += 1;
    voiceSessionActiveRef.current = false;
    clearPausedState();
    clearMicMutedState();
    setSessionPhase('disconnecting');

    try {
      await conversation.endSession();
    } catch {
      // endSession may throw if already disconnected
    }

    const pendingStart = startSessionPromiseRef.current;
    if (pendingStart) {
      try {
        await pendingStart;
      } catch {
        // start may fail if session was cancelled
      }
    }

    if (force) {
      voiceSessionActiveRef.current = false;
      startSessionPromiseRef.current = null;
      setSessionPhase('idle');
      setIsLoading(false);
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
      void releaseVoiceAudioSession();
    }

    onTranscript?.('');
    processedRef.current.clear();
    sessionMessagesRef.current = [];
  }, [
    clearMicMutedState,
    clearPausedState,
    conversation,
    onConnectingChange,
    onTranscript,
    onVoiceModeChange,
    sessionPhase,
  ]);

  const ensureMicrophonePermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (alreadyGranted) return true;
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissão de microfone',
          message:
            'O Bud precisa do microfone para transcrever sua fala no modo por voz.',
          buttonNeutral: 'Depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (Platform.OS === 'ios') {
      const current = await Audio.getPermissionsAsync();
      if (current.status === 'granted') return true;

      const requested = await Audio.requestPermissionsAsync();
      if (requested.status === 'granted') return true;

      appAlert({
        title: 'Permissão necessária',
        message: 'Ative o microfone do Bud em Ajustes para usar conversas por voz.',
        buttons: [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir Ajustes',
            onPress: () => {
              Linking.openSettings().catch(() => {});
            },
          },
        ],
      });
      return false;
    }

    return true;
  }, []);

  const startConversation = useCallback(async (options?: StartVoiceConversationOptions) => {
    if (sessionPhase !== 'idle') {
      return;
    }

    const generation = ++startGenerationRef.current;
    voiceSessionActiveRef.current = true;
    clearPausedState();
    clearMicMutedState();
    setSessionPhase('connecting');
    onVoiceModeChange?.(true);
    onConnectingChange?.(true);
    setIsLoading(true);

    const hasMic = await ensureMicrophonePermission();
    if (!hasMic) {
      if (generation !== startGenerationRef.current) {
        return;
      }
      voiceSessionActiveRef.current = false;
      setSessionPhase('idle');
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
      setIsLoading(false);
      appAlert({
        title: 'Permissão necessária',
        message: 'Sem permissão de microfone, o modo por voz não consegue transcrever sua fala.',
      });
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
        voiceSessionActiveRef.current = false;
        setSessionPhase('idle');
        onConnectingChange?.(false);
        onVoiceModeChange?.(false);
        setIsLoading(false);
        return;
      }

      sessionMessagesRef.current = toVoiceSessionMessages(messageHistoryRef.current);

      const serverContext = await fetchVoiceServerContext(
        sessionMessagesRef.current,
        'full',
      );

      if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
        voiceSessionActiveRef.current = false;
        setSessionPhase('idle');
        onConnectingChange?.(false);
        onVoiceModeChange?.(false);
        setIsLoading(false);
        return;
      }

      const token = serverContext.token ?? undefined;
      if (!token) throw new Error('Token de voz não retornado');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const prompt = assembleVoicePrompt(
        userContextRef.current,
        recentInsightsRef.current,
        internalProfileRef.current,
        serverContext,
      );
      const sessionOptions = buildVoiceSessionStartOptions({
        conversationToken: token,
        prompt,
        userId: user?.id,
        userContext: userContextRef.current,
        firstMessage: resolveVoiceFirstMessage(options),
      });
      lastSessionConfigRef.current = omitVoiceFirstMessage(sessionOptions);
      const startPromise = Promise.resolve(conversation.startSession(sessionOptions));
      startSessionPromiseRef.current = startPromise;
      await startPromise;
      startSessionPromiseRef.current = null;
    } catch (e) {
      startSessionPromiseRef.current = null;
      if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
        return;
      }
      voiceSessionActiveRef.current = false;
      setSessionPhase('idle');
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
      setIsLoading(false);
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
      appAlert({ title: 'Erro', message: msg });
      void releaseVoiceAudioSession();
    } finally {
      if (generation === startGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    clearMicMutedState,
    clearPausedState,
    conversation,
    ensureMicrophonePermission,
    onConnectingChange,
    onVoiceModeChange,
    sessionPhase,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      startConversation,
      endConversation,
      setPaused,
      togglePaused: () => setPaused(!isPausedRef.current),
      setMicMuted,
      toggleMicMuted: () => setMicMuted(!isMicMutedRef.current),
    }),
    [startConversation, endConversation, setPaused, setMicMuted],
  );

  const isConnected = sessionPhase === 'connected';
  useVoiceSessionKeepAwake(isConnected || isSessionLocked);

  return (
    <VoiceButtonVisual
      appearance={appearance}
      prominentSize={prominentSize}
      isConnected={isConnected}
      isLoading={isLoading || sessionPhase === 'disconnecting'}
      onPress={isConnected ? endConversation : () => { void startConversation(); }}
      disabled={isSessionLocked}
    />
  );
}

const VoiceInterfaceNative = forwardRef<VoiceInterfaceRef, VoiceInterfaceProps>(
  VoiceInterfaceNativeInner,
);

export const VoiceInterface = forwardRef<VoiceInterfaceRef, VoiceInterfaceProps>(
  function VoiceInterface(props, ref) {
    if (Platform.OS !== 'web') {
      return <VoiceInterfaceNative ref={ref} {...props} />;
    }

    return (
      <VoiceInterfaceWeb ref={ref} {...props} />
    );
  },
);

const VoiceInterfaceWeb = forwardRef<VoiceInterfaceRef, VoiceInterfaceProps>(
  function VoiceInterfaceWeb(
    {
      appearance = 'default',
      prominentSize,
      onTranscript,
      onVoiceModeChange,
      onConnectingChange,
      onSessionBusyChange,
      onPausedChange,
      onMicMutedChange,
      onUserMessage,
      onAssistantMessage,
      onAssistantTranscript,
      onSpeakingChange,
      onSafetyTriggered,
      userContext,
      messageHistory,
      recentInsights,
      internalProfile,
    },
    ref,
  ) {
    const [sessionPhase, setSessionPhase] = useState<VoiceSessionPhase>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const conversationRef = useRef<ElevenLabsConversation | null>(null);
    const lastSessionConfigRef = useRef<VoiceSessionStartOptions | null>(null);
    const processedMessagesRef = useRef<Set<string>>(new Set());
    const voiceSessionActiveRef = useRef(false);
    const startGenerationRef = useRef(0);
    const isPausedRef = useRef(false);
    const isMicMutedRef = useRef(false);
    const pauseActivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(
      null,
    );
    const sessionMessagesRef = useRef<VoiceChatMessage[]>([]);
    const refreshClinicalContextRef = useRef<
      ReturnType<typeof createVoiceContextRefresher> | null
    >(null);
    const processVoiceUserTurnRef = useRef<(text: string) => void>(() => {});
    const processVoiceAssistantTurnRef = useRef<(text: string) => void>(() => {});
    const userContextRef = useRef(userContext);
    const messageHistoryRef = useRef(messageHistory);
    const recentInsightsRef = useRef(recentInsights);
    const internalProfileRef = useRef(internalProfile);
    userContextRef.current = userContext;
    messageHistoryRef.current = messageHistory;
    recentInsightsRef.current = recentInsights;
    internalProfileRef.current = internalProfile;
    const isSessionLocked =
      sessionPhase === 'connecting' || sessionPhase === 'disconnecting';

    useEffect(() => {
      onSessionBusyChange?.(isSessionLocked);
    }, [isSessionLocked, onSessionBusyChange]);

    const clearPauseKeepAlive = useCallback(() => {
      if (pauseActivityTimerRef.current) {
        clearInterval(pauseActivityTimerRef.current);
        pauseActivityTimerRef.current = null;
      }
    }, []);

    const clearPausedState = useCallback(() => {
      const wasPaused = isPausedRef.current;
      isPausedRef.current = false;
      clearPauseKeepAlive();
      if (wasPaused) {
        onPausedChange?.(false);
      }
    }, [clearPauseKeepAlive, onPausedChange]);

    const clearMicMutedState = useCallback(() => {
      const wasMuted = isMicMutedRef.current;
      isMicMutedRef.current = false;
      if (wasMuted) {
        onMicMutedChange?.(false);
      }
    }, [onMicMutedChange]);

    useEffect(() => {
      refreshClinicalContextRef.current = createVoiceContextRefresher((text) => {
        conversationRef.current?.sendContextualUpdate?.(text);
      });
    }, []);

    useEffect(() => {
      processVoiceUserTurnRef.current = (text: string) => {
        sessionMessagesRef.current.push({ role: 'user', content: text });
        void refreshClinicalContextRef.current?.(sessionMessagesRef.current);
        onUserMessage?.(text);
      };
      processVoiceAssistantTurnRef.current = (text: string) => {
        sessionMessagesRef.current.push({ role: 'assistant', content: text });
        onAssistantMessage?.(text);
      };
    }, [onAssistantMessage, onUserMessage]);

    const setPaused = useCallback(
      (paused: boolean) => {
        if (sessionPhase !== 'connected') return;
        if (isPausedRef.current === paused) return;

        isPausedRef.current = paused;
        onPausedChange?.(paused);

        const conversation = conversationRef.current;
        if (paused) {
          try {
            conversation?.setMicMuted?.(true);
          } catch {
            // ignore mute failures while pausing
          }
          try {
            conversation?.sendUserActivity?.();
          } catch {
            // ignore activity signal failures
          }
          clearPauseKeepAlive();
          pauseActivityTimerRef.current = setInterval(() => {
            try {
              conversationRef.current?.sendUserActivity?.();
            } catch {
              // ignore activity signal failures while paused
            }
          }, VOICE_PAUSE_ACTIVITY_INTERVAL_MS);
          return;
        }

        clearPauseKeepAlive();
        try {
          conversation?.setMicMuted?.(isMicMutedRef.current);
        } catch {
          // ignore unmute failures while resuming
        }
      },
      [clearPauseKeepAlive, onPausedChange, sessionPhase],
    );

    const setMicMuted = useCallback(
      (muted: boolean) => {
        if (sessionPhase !== 'connected') return;
        if (isMicMutedRef.current === muted) return;

        isMicMutedRef.current = muted;
        onMicMutedChange?.(muted);
        playVoiceMuteSound(muted);

        if (isPausedRef.current) return;

        try {
          conversationRef.current?.setMicMuted?.(muted);
        } catch {
          // ignore mute failures
        }
      },
      [onMicMutedChange, sessionPhase],
    );

    const endConversation = useCallback(async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      if (!force && (sessionPhase === 'connecting' || sessionPhase === 'disconnecting')) {
        return;
      }
      if (!force && sessionPhase !== 'connected') {
        return;
      }

      startGenerationRef.current += 1;
      voiceSessionActiveRef.current = false;
      clearPausedState();
      clearMicMutedState();
      setSessionPhase('disconnecting');

      if (conversationRef.current) {
        try {
          await conversationRef.current.endSession();
        } catch {
          // session may already be ended
        }
        conversationRef.current = null;
      }

      if (force) {
        setSessionPhase('idle');
        setIsLoading(false);
        onConnectingChange?.(false);
        onVoiceModeChange?.(false);
      }

      onTranscript?.('');
      processedMessagesRef.current.clear();
      sessionMessagesRef.current = [];
    }, [
      clearMicMutedState,
      clearPausedState,
      onConnectingChange,
      onVoiceModeChange,
      onTranscript,
      sessionPhase,
    ]);

    const startConversation = useCallback(async (options?: StartVoiceConversationOptions) => {
      if (sessionPhase !== 'idle') {
        return;
      }

      const generation = ++startGenerationRef.current;
      voiceSessionActiveRef.current = true;
      clearPausedState();
      clearMicMutedState();
      setSessionPhase('connecting');
      onVoiceModeChange?.(true);
      onConnectingChange?.(true);
      setIsLoading(true);
      try {
        sessionMessagesRef.current = toVoiceSessionMessages(messageHistoryRef.current);

        const serverContext = await fetchVoiceServerContext(
          sessionMessagesRef.current,
          'full',
        );

        if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
          voiceSessionActiveRef.current = false;
          setSessionPhase('idle');
          onConnectingChange?.(false);
          onVoiceModeChange?.(false);
          setIsLoading(false);
          return;
        }

        const signedUrl = serverContext.signed_url ?? undefined;
        if (!signedUrl) throw new Error('Failed to get signed URL');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const prompt = assembleVoicePrompt(
          userContextRef.current,
          recentInsightsRef.current,
          internalProfileRef.current,
          serverContext,
        );
        const sessionOptions = buildVoiceSessionStartOptions({
          signedUrl,
          prompt,
          userId: user?.id,
          userContext: userContextRef.current,
          firstMessage: resolveVoiceFirstMessage(options),
        });
        lastSessionConfigRef.current = omitVoiceFirstMessage(sessionOptions);
        const { Conversation } = await import('@elevenlabs/client');
        conversationRef.current = await Conversation.startSession({
          ...sessionOptions,
          onConnect: () => {
            if (!voiceSessionActiveRef.current) {
              return;
            }
            setSessionPhase('connected');
            setIsLoading(false);
            onConnectingChange?.(false);
          },
          onDisconnect: () => {
            voiceSessionActiveRef.current = false;
            clearPausedState();
            clearMicMutedState();
            setSessionPhase('idle');
            setIsLoading(false);
            onConnectingChange?.(false);
            onVoiceModeChange?.(false);
          },
          onMessage: (message: ElevenLabsMessage) => {
            const source = message.source;
            const text = (message.message || message.content || '').trim();
            if (!text) return;
            const messageKey = `${source}-${text}`;
            if (processedMessagesRef.current.has(messageKey)) return;
            processedMessagesRef.current.add(messageKey);
            setTimeout(
              () => processedMessagesRef.current.delete(messageKey),
              10000,
            );
            if (source === 'user') {
              onTranscript?.(text);
              processVoiceUserTurnRef.current(text);
            }
            if (source === 'ai') {
              if (isSafetyResponse(text)) {
                onAssistantMessage?.(text);
                voiceSessionActiveRef.current = false;
                clearPausedState();
                clearMicMutedState();
                setSessionPhase('disconnecting');
                if (conversationRef.current) {
                  void conversationRef.current.endSession();
                  conversationRef.current = null;
                }
                onTranscript?.('');
                processedMessagesRef.current.clear();
                onSafetyTriggered?.();
                appAlert({
                  title: 'Apoio disponível',
                  message: 'Se precisar de ajuda, o CVV está disponível 24h pelo 188.',
                });
                return;
              }
              processVoiceAssistantTurnRef.current(text);
              onAssistantTranscript?.(text);
            }
          },
          onModeChange: (mode: ElevenLabsModeChange) => {
            if (mode && typeof mode === 'object' && 'mode' in mode) {
              onSpeakingChange?.(mode.mode === 'speaking');
            }
          },
          onError: () => {
            voiceSessionActiveRef.current = false;
            clearPausedState();
            clearMicMutedState();
            setSessionPhase('idle');
            onConnectingChange?.(false);
            appAlert({ title: 'Erro', message: 'Erro na conexão de voz' });
            setIsLoading(false);
            onVoiceModeChange?.(false);
          },
        });
      } catch (e) {
        if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
          return;
        }
        voiceSessionActiveRef.current = false;
        clearPausedState();
        clearMicMutedState();
        setSessionPhase('idle');
        onConnectingChange?.(false);
        onVoiceModeChange?.(false);
        const msg =
          e instanceof Error ? e.message : 'Falha ao iniciar conversa';
        appAlert({ title: 'Erro', message: msg });
        setIsLoading(false);
      }
    }, [
      clearMicMutedState,
      clearPausedState,
      onConnectingChange,
      onVoiceModeChange,
      onTranscript,
      onUserMessage,
      onAssistantMessage,
      onAssistantTranscript,
      onSpeakingChange,
      onSafetyTriggered,
      sessionPhase,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        startConversation,
        endConversation,
        setPaused,
        togglePaused: () => setPaused(!isPausedRef.current),
        setMicMuted,
        toggleMicMuted: () => setMicMuted(!isMicMutedRef.current),
      }),
      [startConversation, endConversation, setPaused, setMicMuted],
    );

    useEffect(() => {
      return () => {
        clearPauseKeepAlive();
        void conversationRef.current?.endSession();
      };
    }, [clearPauseKeepAlive]);

    const isConnected = sessionPhase === 'connected';
    useVoiceSessionKeepAwake(isConnected || isSessionLocked);

    return (
      <VoiceButtonVisual
        appearance={appearance}
        prominentSize={prominentSize}
        isConnected={isConnected}
        isLoading={isLoading || sessionPhase === 'disconnecting'}
        onPress={isConnected ? endConversation : () => { void startConversation(); }}
        disabled={isSessionLocked}
      />
    );
  },
);
