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
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff } from 'lucide-react-native';
import { useConversation } from '@elevenlabs/react-native';
import { supabase } from '@/integrations/supabase/client';
import { isSafetyResponse } from '@/utils/safetyDetection';
import {
  buildVoicePrompt,
  enrichVoicePrompt,
  type UserContext,
} from '@/voice/voicePrompt';
import { useAppColors } from '@/lib/colors';
import { useVoiceSessionKeepAwake } from '@/hooks/useVoiceSessionKeepAwake';
import {
  getVoiceButtonDimensions,
  getVoiceButtonStyles,
  type VoiceAppearance,
} from '@/voice/VoiceInterface.styles';
import { ProminentVoiceButton } from '@/voice/ProminentVoiceButton';
import type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';
import { buildVoiceSessionStartOptions, type VoiceSessionStartOptions } from '@/voice/voiceElevenLabsSession';

async function resolveVoiceFunctionError(
  error: unknown,
  response?: Response,
): Promise<string> {
  if (response) {
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // response body may be empty or non-JSON
    }
  }
  if (error instanceof Error) {
    if (error.message.includes('Failed to send a request')) {
      return 'Sem conexão com o servidor de voz. Verifique sua internet e tente novamente.';
    }
    if (error.message.includes('non-2xx')) {
      return 'Serviço de voz temporariamente indisponível. Tente novamente em instantes.';
    }
    return error.message;
  }
  return 'Erro ao obter token de voz';
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
}

export interface VoiceInterfaceProps {
  appearance?: VoiceAppearance;
  prominentSize?: number;
  onTranscript?: (text: string) => void;
  onVoiceModeChange?: (active: boolean) => void;
  onConnectingChange?: (connecting: boolean) => void;
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

export type { VoiceInterfaceRef } from '@/voice/VoiceInterface.types';

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
        <Mic size={iconSize} color={iconColor} strokeWidth={2.25} />
      )}
    </TouchableOpacity>
  );
}

function VoiceInterfaceNativeInner(
  {
    appearance = 'default',
    prominentSize,
    onTranscript,
    onVoiceModeChange,
    onConnectingChange,
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
  const processedRef = useRef<Set<string>>(new Set());
  const noResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMsgAtRef = useRef<number | null>(null);
  const lastAiMsgAtRef = useRef<number | null>(null);
  const micArmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const conversation = useConversation({
    onStatusChange: (event: { status: string }) => {
      statusRef.current = event.status;
    },
    onConnect: () => {
      if (!voiceSessionActiveRef.current) {
        try {
          void conversation.endSession();
        } catch {
          // session may already be ended
        }
        return;
      }

      onConnectingChange?.(false);
      restartGuardRef.current = { inFlight: false, lastAt: 0, attempts: 0 };

      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
      setTimeout(() => {
        try {
          conversation.setMuted(false);
        } catch {
          // ignore unmute failures on connect
        }
      }, 600);
      let attempts = 0;
      micArmTimerRef.current = setInterval(() => {
        attempts += 1;
        if (!conversation.isMuted) {
          if (micArmTimerRef.current) {
            clearInterval(micArmTimerRef.current);
            micArmTimerRef.current = null;
          }
          return;
        }
        try {
          conversation.setMuted(false);
        } catch {
          // ignore unmute failures while arming mic
        }
        if (attempts >= 20 && micArmTimerRef.current) {
          clearInterval(micArmTimerRef.current);
          micArmTimerRef.current = null;
        }
      }, 200);
    },
    onDisconnect: () => {
      voiceSessionActiveRef.current = false;
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
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
                try {
                  conversation.setMuted(false);
                } catch {
                  // ignore unmute failures after restart
                }
              })
              .catch(() => {})
              .finally(() => {
                restartGuardRef.current.inFlight = false;
              });
          }, 20000);
        }
        onUserMessage?.(text);
      }
      if (props.source === 'ai') {
        lastAiMsgAtRef.current = Date.now();
        if (noResponseTimerRef.current) {
          clearTimeout(noResponseTimerRef.current);
          noResponseTimerRef.current = null;
        }
        if (isSafetyResponse(text)) {
          onAssistantMessage?.(text);
          conversation.endSession();
          onVoiceModeChange?.(false);
          onTranscript?.('');
          processedRef.current.clear();
          onSafetyTriggered?.();
          Alert.alert(
            'Apoio disponível',
            'Se precisar de ajuda, o CVV está disponível 24h pelo 188.',
          );
          return;
        }
        onAssistantMessage?.(text);
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
      onConnectingChange?.(false);
      Alert.alert('Erro', message || 'Erro na conexão de voz');
      onVoiceModeChange?.(false);
    },
  });

  useEffect(() => {
    return () => {
      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
    };
  }, []);

  const endConversation = useCallback(async () => {
    startGenerationRef.current += 1;
    voiceSessionActiveRef.current = false;
    onConnectingChange?.(false);
    await conversation.endSession();
    onVoiceModeChange?.(false);
    onTranscript?.('');
    processedRef.current.clear();
  }, [conversation, onConnectingChange, onVoiceModeChange, onTranscript]);

  const [isLoading, setIsLoading] = useState(false);

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

      Alert.alert(
        'Permissão necessária',
        'Ative o microfone do Bud em Ajustes para usar conversas por voz.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir Ajustes',
            onPress: () => {
              Linking.openSettings().catch(() => {});
            },
          },
        ],
      );
      return false;
    }

    return true;
  }, []);

  const startConversation = useCallback(async () => {
    const generation = ++startGenerationRef.current;
    voiceSessionActiveRef.current = true;
    onVoiceModeChange?.(true);
    onConnectingChange?.(true);
    setIsLoading(true);

    const hasMic = await ensureMicrophonePermission();
    if (!hasMic) {
      if (generation !== startGenerationRef.current) {
        return;
      }
      voiceSessionActiveRef.current = false;
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
      setIsLoading(false);
      Alert.alert(
        'Permissão necessária',
        'Sem permissão de microfone, o modo por voz não consegue transcrever sua fala.',
      );
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
        return;
      }

      const { data, error, response } = await supabase.functions.invoke(
        'chat-voice',
        {
          body: { messages: messageHistory ?? [] },
        },
      );
      if (error) {
        throw new Error(await resolveVoiceFunctionError(error, response));
      }

      if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
        return;
      }

      const token = data?.token as string | undefined;
      if (!token) throw new Error('Token de voz não retornado');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const serverProfile =
        (data?.internal_profile as string | undefined) ?? internalProfile;
      const prompt = enrichVoicePrompt(
        buildVoicePrompt(
          userContext,
          messageHistory,
          recentInsights,
          serverProfile,
        ),
        {
          clinicalContext: data?.clinical_context as string | undefined,
        },
      );
      const sessionOptions = buildVoiceSessionStartOptions({
        conversationToken: token,
        prompt,
        userId: user?.id,
        userContext,
      });
      lastSessionConfigRef.current = sessionOptions;
      await conversation.startSession(sessionOptions);
    } catch (e) {
      if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
        return;
      }
      voiceSessionActiveRef.current = false;
      onConnectingChange?.(false);
      onVoiceModeChange?.(false);
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
      Alert.alert('Erro', msg);
    } finally {
      if (generation === startGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    conversation,
    ensureMicrophonePermission,
    internalProfile,
    messageHistory,
    onConnectingChange,
    onVoiceModeChange,
    recentInsights,
    userContext,
  ]);

  useImperativeHandle(
    ref,
    () => ({ startConversation, endConversation }),
    [startConversation, endConversation],
  );

  const isConnected = conversation.status === 'connected';
  useVoiceSessionKeepAwake(isConnected || isLoading);

  return (
    <VoiceButtonVisual
      appearance={appearance}
      prominentSize={prominentSize}
      isConnected={isConnected}
      isLoading={isLoading}
      onPress={isConnected ? endConversation : startConversation}
      disabled={isLoading}
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
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const conversationRef = useRef<ElevenLabsConversation | null>(null);
    const lastSessionConfigRef = useRef<VoiceSessionStartOptions | null>(null);
    const processedMessagesRef = useRef<Set<string>>(new Set());
    const voiceSessionActiveRef = useRef(false);
    const startGenerationRef = useRef(0);

    const endConversation = useCallback(async () => {
      startGenerationRef.current += 1;
      voiceSessionActiveRef.current = false;
      onConnectingChange?.(false);
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
      setIsConnected(false);
      setIsLoading(false);
      onVoiceModeChange?.(false);
      onTranscript?.('');
      processedMessagesRef.current.clear();
    }, [onConnectingChange, onVoiceModeChange, onTranscript]);

    const startConversation = useCallback(async () => {
      const generation = ++startGenerationRef.current;
      voiceSessionActiveRef.current = true;
      onVoiceModeChange?.(true);
      onConnectingChange?.(true);
      setIsLoading(true);
      try {
        const { data, error, response } = await supabase.functions.invoke(
          'chat-voice',
          {
            body: { messages: messageHistory ?? [] },
          },
        );
        if (error) {
          throw new Error(await resolveVoiceFunctionError(error, response));
        }

        if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
          return;
        }

        const signedUrl = data?.signed_url as string | undefined;
        if (!signedUrl) throw new Error('Failed to get signed URL');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const serverProfile =
          (data?.internal_profile as string | undefined) ?? internalProfile;
        const prompt = enrichVoicePrompt(
          buildVoicePrompt(
            userContext,
            messageHistory,
            recentInsights,
            serverProfile,
          ),
          {
            clinicalContext: data?.clinical_context as string | undefined,
          },
        );
        const sessionOptions = buildVoiceSessionStartOptions({
          signedUrl,
          prompt,
          userId: user?.id,
          userContext,
        });
        lastSessionConfigRef.current = sessionOptions;
        const { Conversation } = await import('@elevenlabs/client');
        conversationRef.current = await Conversation.startSession({
          ...sessionOptions,
          onConnect: () => {
            if (!voiceSessionActiveRef.current) {
              void conversationRef.current?.endSession();
              return;
            }
            setIsConnected(true);
            setIsLoading(false);
            onConnectingChange?.(false);
          },
          onDisconnect: () => {
            voiceSessionActiveRef.current = false;
            setIsConnected(false);
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
              onUserMessage?.(text);
            }
            if (source === 'ai') {
              if (isSafetyResponse(text)) {
                onAssistantMessage?.(text);
                if (conversationRef.current) {
                  conversationRef.current.endSession();
                  conversationRef.current = null;
                  setIsConnected(false);
                  onVoiceModeChange?.(false);
                  onTranscript?.('');
                  processedMessagesRef.current.clear();
                }
                onSafetyTriggered?.();
                Alert.alert(
                  'Apoio disponível',
                  'Se precisar de ajuda, o CVV está disponível 24h pelo 188.',
                );
                return;
              }
              onAssistantMessage?.(text);
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
            onConnectingChange?.(false);
            Alert.alert('Erro', 'Erro na conexão de voz');
            setIsConnected(false);
            setIsLoading(false);
            onVoiceModeChange?.(false);
          },
        });
      } catch (e) {
        if (!voiceSessionActiveRef.current || generation !== startGenerationRef.current) {
          return;
        }
        voiceSessionActiveRef.current = false;
        onConnectingChange?.(false);
        onVoiceModeChange?.(false);
        const msg =
          e instanceof Error ? e.message : 'Falha ao iniciar conversa';
        Alert.alert('Erro', msg);
        setIsLoading(false);
      }
    }, [
      userContext,
      messageHistory,
      recentInsights,
      internalProfile,
      onConnectingChange,
      onVoiceModeChange,
      onTranscript,
      onUserMessage,
      onAssistantMessage,
      onAssistantTranscript,
      onSpeakingChange,
      onSafetyTriggered,
    ]);

    useImperativeHandle(
      ref,
      () => ({ startConversation, endConversation }),
      [startConversation, endConversation],
    );

    useEffect(() => {
      return () => {
        conversationRef.current?.endSession();
      };
    }, []);

    useVoiceSessionKeepAwake(isConnected || isLoading);

    return (
      <VoiceButtonVisual
        appearance={appearance}
        prominentSize={prominentSize}
        isConnected={isConnected}
        isLoading={isLoading}
        onPress={isConnected ? endConversation : startConversation}
        disabled={isLoading}
      />
    );
  },
);
