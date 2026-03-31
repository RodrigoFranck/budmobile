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
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useConversation } from '@elevenlabs/react-native';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';
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
  const { canAccess } = useUserPlan();
  const processedRef = useRef<Set<string>>(new Set());
  const sessionStartedAtRef = useRef<number | null>(null);
  const receivedAiRef = useRef(false);
  const noResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMsgAtRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      sessionStartedAtRef.current = Date.now();
      receivedAiRef.current = false;
      voiceLog('connected');
      try {
        conversation.setMicMuted(false);
        voiceLog('mic unmuted');
      } catch (e) {
        voiceLog('failed to unmute mic', e);
      }
      if (noResponseTimerRef.current) clearTimeout(noResponseTimerRef.current);
      noResponseTimerRef.current = setTimeout(() => {
        if (!receivedAiRef.current) {
          voiceLog('no AI response after 15s -> ending session');
          const hasUserTranscription = lastUserMsgAtRef.current !== null;
          const message =
            `O microfone conectou, mas nenhuma resposta chegou.\n\n` +
            `- Transcrição do usuário chegou? ${hasUserTranscription ? 'Sim' : 'Não'}\n\n` +
            `Isso costuma ser: microfone/STT não chegando, instabilidade de rede, ou problema no servidor de voz.\n\n` +
            `Dica: se você tocar em "Enviar teste", vamos mandar uma mensagem de texto direto pro SDK (sem microfone) pra isolar o problema.`;

          Alert.alert('Sem resposta no modo de voz', message, [
            {
              text: 'Encerrar',
              style: 'destructive',
              onPress: () => {
                conversation.endSession();
              },
            },
            {
              text: 'Enviar teste',
              style: 'default',
              onPress: () => {
                try {
                  voiceLog('sending debug user message');
                  conversation.sendUserMessage('teste');
                } catch (e) {
                  voiceLog('failed to send debug user message', e);
                }
              },
            },
            { text: 'OK' },
          ]);
        }
      }, 15000);
      onVoiceModeChange?.(true);
    },
    onDisconnect: () => {
      onVoiceModeChange?.(false);
      voiceLog('disconnected');
      if (noResponseTimerRef.current) {
        clearTimeout(noResponseTimerRef.current);
        noResponseTimerRef.current = null;
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
        onTranscript?.(text);
        onUserMessage?.(text);
      }
      if (props.source === 'ai') {
        receivedAiRef.current = true;
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
      }
    },
    onModeChange: (props: { mode: 'speaking' | 'listening' }) => {
      voiceLog('mode', props.mode);
      onSpeakingChange?.(props.mode === 'speaking');
    },
    onError: (message: string) => {
      voiceLog('error', message);
      Alert.alert('Erro', message || 'Erro na conexão de voz');
      onVoiceModeChange?.(false);
    },
  });

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    onVoiceModeChange?.(false);
    onTranscript?.('');
    processedRef.current.clear();
  }, [conversation, onVoiceModeChange, onTranscript]);

  useImperativeHandle(ref, () => ({ endConversation }), [endConversation]);

  const [isLoading, setIsLoading] = useState(false);

  const startConversation = useCallback(async () => {
    if (!__DEV__ && !canAccess('voice_mode')) {
      Alert.alert(
        'Modo de voz',
        'Converse com o Bud por voz no plano Profundo. Faça upgrade para desbloquear.',
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
      await conversation.startSession({
        conversationToken: token,
        overrides: {
          agent: {
            prompt: { prompt },
          },
        },
      });
      voiceLog('startSession resolved');
      try {
        conversation.setMicMuted(false);
        voiceLog('mic unmuted (post-start)');
      } catch (e) {
        voiceLog('failed to unmute mic (post-start)', e);
      }
    } catch (e) {
      voiceLog('startConversation catch', e);
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    canAccess,
    conversation,
    internalProfile,
    messageHistory,
    recentInsights,
    userContext,
  ]);

  const isConnected = conversation.status === 'connected';

  return (
    <View className="justify-center">
      <TouchableOpacity
        onPress={isConnected ? endConversation : startConversation}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={
          isConnected ? 'Encerrar voz' : 'Iniciar conversa por voz'
        }
        className="h-10 w-10 items-center justify-center"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.foreground} />
        ) : isConnected ? (
          <MicOff size={22} color={colors.destructive} />
        ) : (
          <Mic size={22} color={colors['foreground-muted']} />
        )}
      </TouchableOpacity>
    </View>
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
    const { canAccess } = useUserPlan();
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
      if (!__DEV__ && !canAccess('voice_mode')) {
        Alert.alert(
          'Modo de voz',
          'Converse com o Bud por voz no plano Profundo. Faça upgrade para desbloquear.',
        );
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('chat-voice');
        if (error) throw error;
        const signedUrl = data?.signed_url as string | undefined;
        if (!signedUrl) throw new Error('Failed to get signed URL');
        const { Conversation } = await import('@11labs/client');
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
      canAccess,
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

    return (
      <View className="justify-center">
        <TouchableOpacity
          onPress={isConnected ? endConversation : startConversation}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isConnected ? 'Encerrar voz' : 'Iniciar conversa por voz'
          }
          className="h-10 w-10 items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : isConnected ? (
            <MicOff size={22} color={colors.destructive} />
          ) : (
            <Mic size={22} color={colors['foreground-muted']} />
          )}
        </TouchableOpacity>
      </View>
    );
  },
);
