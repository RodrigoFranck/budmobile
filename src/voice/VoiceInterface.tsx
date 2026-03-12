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
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';
import { isSafetyResponse } from '@/utils/safetyDetection';
import {
  buildFirstMessage,
  buildVoicePrompt,
  type UserContext,
} from '@/voice/voicePrompt';
import { colors } from '@/lib/colors';
import { VoiceWebViewModal } from '@/voice/VoiceWebViewModal';

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

export const VoiceInterface = forwardRef<VoiceInterfaceRef, VoiceInterfaceProps>(
  function VoiceInterface(
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
    const [webViewVisible, setWebViewVisible] = useState(false);
    const [webSession, setWebSession] = useState<Session | null>(null);
    const conversationRef = useRef<ElevenLabsConversation | null>(null);
    const processedMessagesRef = useRef<Set<string>>(new Set());

    const endConversation = useCallback(async () => {
      if (Platform.OS !== 'web' && webViewVisible) {
        setWebViewVisible(false);
        onVoiceModeChange?.(false);
        return;
      }
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
        setIsConnected(false);
        onVoiceModeChange?.(false);
        onTranscript?.('');
        processedMessagesRef.current.clear();
      }
    }, [onVoiceModeChange, onTranscript, webViewVisible]);

    useImperativeHandle(ref, () => ({ endConversation }), [endConversation]);

    const startConversation = useCallback(async () => {
      if (!__DEV__ && !canAccess('voice_mode')) {
        Alert.alert(
          'Modo de voz',
          'Converse com o Bud por voz no plano Profundo. Faça upgrade para desbloquear.',
        );
        return;
      }

      if (Platform.OS !== 'web') {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            Alert.alert(
              'Sessão necessária',
              'Entre no app antes de usar a conversa por voz na web.',
            );
            return;
          }
          setWebSession(data.session);
          setWebViewVisible(true);
        } finally {
          setIsLoading(false);
        }
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
            setTimeout(() => processedMessagesRef.current.delete(messageKey), 10000);

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
        const msg = e instanceof Error ? e.message : 'Falha ao iniciar conversa';
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

    const isNativeVoiceOpen = Platform.OS !== 'web' && webViewVisible;

    return (
      <View className="justify-center">
        <VoiceWebViewModal
          visible={webViewVisible}
          session={webSession}
          onClose={() => {
            setWebViewVisible(false);
            setWebSession(null);
            onVoiceModeChange?.(false);
          }}
        />
        <TouchableOpacity
          onPress={
            isConnected || isNativeVoiceOpen ? endConversation : startConversation
          }
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isConnected || isNativeVoiceOpen
              ? 'Encerrar voz'
              : 'Iniciar conversa por voz'
          }
          className="h-10 w-10 items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : isConnected || isNativeVoiceOpen ? (
            <MicOff size={22} color={colors.destructive} />
          ) : (
            <Mic size={22} color={colors['foreground-muted']} />
          )}
        </TouchableOpacity>
      </View>
    );
  },
);
