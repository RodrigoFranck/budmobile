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
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useConversation } from '@elevenlabs/react-native';
import { supabase } from '@/integrations/supabase/client';
import { isSafetyResponse } from '@/utils/safetyDetection';
import {
  buildVoicePrompt,
  type UserContext,
} from '@/voice/voicePrompt';
import { colors } from '@/lib/colors';

function voiceLog(...args: unknown[]) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log('[voice]', ...args);
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
}

export interface VoiceInterfaceProps {
  appearance?: 'default' | 'companion';
  onTranscript?: (text: string) => void;
  onVoiceModeChange?: (active: boolean) => void;
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

export interface VoiceInterfaceRef {
  endConversation: () => Promise<void>;
}

function VoiceInterfaceNativeInner(
  {
    appearance = 'default',
    onTranscript,
    onVoiceModeChange,
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
  const sessionStartedAtRef = useRef<number | null>(null);
  const receivedAiRef = useRef(false);
  const noResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMsgAtRef = useRef<number | null>(null);
  const lastAiMsgAtRef = useRef<number | null>(null);
  const micArmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debugPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<string>('idle');
  const modeRef = useRef<{ mode: 'speaking' | 'listening'; at: number }>({
    mode: 'listening',
    at: 0,
  });
  const speakingStableRef = useRef(false);
  const speakingDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSessionConfigRef = useRef<{ token: string; prompt: string } | null>(
    null,
  );
  const restartGuardRef = useRef({ inFlight: false, lastAt: 0, attempts: 0 });
  const vadRef = useRef({
    sawVoice: false,
    lastAboveAt: 0,
    lastFlushAt: 0,
    mode: 'listening' as 'speaking' | 'listening',
    listeningSinceAt: 0,
  });

  const conversation = useConversation({
    onStatusChange: (event: { status: string }) => {
      statusRef.current = event.status;
      voiceLog('status', event.status);
    },
    onConnect: () => {
      sessionStartedAtRef.current = Date.now();
      receivedAiRef.current = false;
      restartGuardRef.current = { inFlight: false, lastAt: 0, attempts: 0 };
      voiceLog('connected');

      // Poll a bit right after connect to capture muted/status state on Android.
      if (debugPollTimerRef.current) {
        clearInterval(debugPollTimerRef.current);
        debugPollTimerRef.current = null;
      }
      let polls = 0;
      debugPollTimerRef.current = setInterval(() => {
        polls += 1;
        voiceLog('state', {
          status: statusRef.current,
          isMuted: conversation.isMuted,
          isSpeaking: conversation.isSpeaking,
        });
        if (polls >= 20 && debugPollTimerRef.current) {
          clearInterval(debugPollTimerRef.current);
          debugPollTimerRef.current = null;
        }
      }, 250);

      if (micArmTimerRef.current) {
        clearInterval(micArmTimerRef.current);
        micArmTimerRef.current = null;
      }
      setTimeout(() => {
        try {
          conversation.setMuted(false);
          voiceLog('mic unmuted (post-connect)');
        } catch (e) {
          voiceLog('failed to unmute mic (post-connect)', e);
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
          voiceLog('mic unmuted (armed)', attempts);
        } catch (e) {
          voiceLog('failed to unmute mic (armed)', attempts, e);
        }
        if (attempts >= 20 && micArmTimerRef.current) {
          clearInterval(micArmTimerRef.current);
          micArmTimerRef.current = null;
        }
      }, 200);
      onVoiceModeChange?.(true);
    },
    onDisconnect: () => {
      onVoiceModeChange?.(false);
      voiceLog('disconnected');
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
      if (debugPollTimerRef.current) {
        clearInterval(debugPollTimerRef.current);
        debugPollTimerRef.current = null;
      }
      const startedAt = sessionStartedAtRef.current;
      const elapsedMs = startedAt ? Date.now() - startedAt : null;
      const disconnectedTooFast = elapsedMs !== null && elapsedMs < 8000;
      if (disconnectedTooFast && !receivedAiRef.current) {
        voiceLog('disconnected too fast (ms)', elapsedMs);
      }
    },
    onMessage: (props: { message: string; source: 'user' | 'ai' }) => {
      const text = (props.message || '').trim();
      if (!text) return;
      voiceLog('message', props.source, text.slice(0, 180));
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
            if (!cfg) return;

            guard.inFlight = true;
            guard.lastAt = now;
            guard.attempts += 1;
            voiceLog('no AI response; restarting session', {
              attempts: guard.attempts,
              sinceUserMs: now - lastUserAt,
            });

            Promise.resolve()
              .then(async () => {
                try {
                  await conversation.endSession();
                } catch (e) {
                  voiceLog('restart endSession failed', e);
                }
                await conversation.startSession({
                  conversationToken: cfg.token,
                  overrides: {
                    agent: {
                      prompt: { prompt: cfg.prompt },
                    },
                  },
                });
                try {
                  conversation.setMuted(false);
                } catch (e) {
                  voiceLog('restart unmute failed', e);
                }
              })
              .catch((e) => voiceLog('restart failed', e))
              .finally(() => {
                restartGuardRef.current.inFlight = false;
              });
          }, 20000);
        }
        onUserMessage?.(text);
      }
      if (props.source === 'ai') {
        receivedAiRef.current = true;
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
      voiceLog('mode', props.mode);
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
    onVadScore: (event: { vadScore: number }) => {
      voiceLog('vad', event.vadScore);
      // Disabled on Android: muting/unmuting based on VAD was causing mode flapping
      // and making the conversation get stuck after the first turn.
    },
    onAsrInitiationMetadata: (event: unknown) => {
      voiceLog('asr metadata', event);
    },
    onConversationMetadata: (event: unknown) => {
      voiceLog('conversation metadata', event);
    },
    onDebug: (event: unknown) => {
      voiceLog('debug', event);
    },
    onError: (message: string) => {
      voiceLog('error', message);
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
      if (debugPollTimerRef.current) {
        clearInterval(debugPollTimerRef.current);
        debugPollTimerRef.current = null;
      }
    };
  }, []);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    onVoiceModeChange?.(false);
    onTranscript?.('');
    processedRef.current.clear();
  }, [conversation, onVoiceModeChange, onTranscript]);

  useImperativeHandle(ref, () => ({ endConversation }), [endConversation]);

  const [isLoading, setIsLoading] = useState(false);

  const ensureMicrophonePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    voiceLog('mic perm check', alreadyGranted);
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
    voiceLog('mic perm request result', granted);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const startConversation = useCallback(async () => {
    const hasMic = await ensureMicrophonePermission();
    if (!hasMic) {
      Alert.alert(
        'Permissão necessária',
        'Sem permissão de microfone, o modo por voz não consegue transcrever sua fala.',
      );
      return;
    }
    setIsLoading(true);
    try {
      voiceLog('fetching token');
      const { data, error } = await supabase.functions.invoke('chat-voice');
      if (error) {
        voiceLog('token error', error);
        const serverMsg =
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: string }).message)
            : null;
        throw new Error(serverMsg || 'Erro ao obter token de voz');
      }
      const token = data?.token as string | undefined;
      voiceLog('token received', Boolean(token));
      if (!token) throw new Error('Token de voz não retornado');
      const prompt = buildVoicePrompt(
        userContext,
        messageHistory,
        recentInsights,
        internalProfile,
      );
      voiceLog('prompt chars', prompt.length);
      lastSessionConfigRef.current = { token, prompt };
      await conversation.startSession({
        conversationToken: token,
        overrides: {
          agent: {
            prompt: { prompt },
          },
        },
      });
      voiceLog('startSession resolved');
    } catch (e) {
      voiceLog('startConversation catch', e);
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    conversation,
    ensureMicrophonePermission,
    internalProfile,
    messageHistory,
    recentInsights,
    userContext,
  ]);

  const isConnected = conversation.status === 'connected';
  const isCompanion = appearance === 'companion';

  return (
    <TouchableOpacity
      onPress={isConnected ? endConversation : startConversation}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={
        isConnected ? 'Encerrar voz' : 'Iniciar conversa por voz'
      }
      className={
        isCompanion
          ? 'h-[52px] w-[40px] items-center justify-center'
          : 'h-10 w-10 items-center justify-center'
      }
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : isConnected ? (
        <MicOff size={22} color={colors.destructive} />
      ) : (
        <Mic
          size={22}
          color={
            isCompanion ? colors['chat-body'] : colors['foreground-muted']
          }
        />
      )}
    </TouchableOpacity>
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
      onTranscript,
      onVoiceModeChange,
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
    const processedMessagesRef = useRef<Set<string>>(new Set());

    const endConversation = useCallback(async () => {
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
        setIsConnected(false);
        onVoiceModeChange?.(false);
        onTranscript?.('');
        processedMessagesRef.current.clear();
      }
    }, [onVoiceModeChange, onTranscript]);

    useImperativeHandle(ref, () => ({ endConversation }), [endConversation]);

    const startConversation = useCallback(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('chat-voice');
        if (error) throw error;
        const signedUrl = data?.signed_url as string | undefined;
        if (!signedUrl) throw new Error('Failed to get signed URL');
        const { Conversation } = await import('@elevenlabs/client');
        conversationRef.current = await Conversation.startSession({
          signedUrl,
          overrides: {
            agent: {
              prompt: {
                prompt: buildVoicePrompt(
                  userContext,
                  messageHistory,
                  recentInsights,
                  internalProfile,
                ),
              },
            },
          },
          onConnect: () => {
            setIsConnected(true);
            setIsLoading(false);
            onVoiceModeChange?.(true);
          },
          onDisconnect: () => {
            setIsConnected(false);
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
            Alert.alert('Erro', 'Erro na conexão de voz');
            setIsConnected(false);
            setIsLoading(false);
          },
        });
      } catch (e) {
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
      onVoiceModeChange,
      onTranscript,
      onUserMessage,
      onAssistantMessage,
      onAssistantTranscript,
      onSpeakingChange,
      onSafetyTriggered,
    ]);

    useEffect(() => {
      return () => {
        conversationRef.current?.endSession();
      };
    }, []);

    const isCompanion = appearance === 'companion';

    return (
      <TouchableOpacity
        onPress={isConnected ? endConversation : startConversation}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={
          isConnected ? 'Encerrar voz' : 'Iniciar conversa por voz'
        }
        className={
          isCompanion
            ? 'h-[52px] w-[40px] items-center justify-center'
            : 'h-10 w-10 items-center justify-center'
        }
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.foreground} />
        ) : isConnected ? (
          <MicOff size={22} color={colors.destructive} />
        ) : (
          <Mic
            size={22}
            color={
              isCompanion ? colors['chat-body'] : colors['foreground-muted']
            }
          />
        )}
      </TouchableOpacity>
    );
  },
);
