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
  buildFirstMessage,
  buildVoicePrompt,
  type UserContext,
} from '@/voice/voicePrompt';
import { colors } from '@/lib/colors';

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

  const conversation = useConversation({
    onConnect: () => {
      onVoiceModeChange?.(true);
    },
    onDisconnect: () => {
      onVoiceModeChange?.(false);
    },
    onMessage: (props: { message: string; source: 'user' | 'ai' }) => {
      const text = (props.message || '').trim();
      if (!text) return;
      const messageKey = `${props.source}-${text}`;
      if (processedRef.current.has(messageKey)) return;
      processedRef.current.add(messageKey);
      setTimeout(() => processedRef.current.delete(messageKey), 10000);
      if (props.source === 'user') {
        onTranscript?.(text);
        onUserMessage?.(text);
      }
      if (props.source === 'ai') {
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
      onSpeakingChange?.(props.mode === 'speaking');
    },
    onError: (message: string) => {
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
      const { data, error } = await supabase.functions.invoke('chat-voice');
      if (error) {
        const serverMsg =
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: string }).message)
            : null;
        throw new Error(serverMsg || 'Erro ao obter token de voz');
      }
      const token = data?.token as string | undefined;
      if (!token) throw new Error('Token de voz não retornado');
      await conversation.startSession({ conversationToken: token });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
      Alert.alert('Erro', msg);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, conversation]);

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
              firstMessage: buildFirstMessage(userContext),
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
