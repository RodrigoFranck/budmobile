import { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { Session } from '@supabase/supabase-js';
import { X } from 'lucide-react-native';
import { BUDMIND_WEB_ORIGIN } from '@/constants/auth';
import { colors } from '@/lib/colors';
import { buildInjectedSessionScript } from '@/voice/buildSessionInjection';

const OPEN_VOICE = 'openVoice=1';

function voiceWebViewUri(origin: string): string {
  const t = origin.trim() || 'https://budmind.lovable.app';
  if (t.includes('openVoice=')) return t;
  if (t.includes('#')) {
    const noTrailing = t.replace(/\/+$/, '');
    if (noTrailing.endsWith('#')) return `${noTrailing}/?${OPEN_VOICE}`;
    if (noTrailing.includes('?')) return `${noTrailing}&${OPEN_VOICE}`;
    return `${noTrailing}?${OPEN_VOICE}`;
  }
  const base = t.replace(/\/$/, '');
  return base.includes('?') ? `${base}&${OPEN_VOICE}` : `${base}/?${OPEN_VOICE}`;
}

export interface VoiceWebViewModalProps {
  visible: boolean;
  onClose: () => void;
  session: Session | null;
}

export function VoiceWebViewModal({
  visible,
  onClose,
  session,
}: VoiceWebViewModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const chatUrl = voiceWebViewUri(BUDMIND_WEB_ORIGIN);
  const injectedBeforeContent =
    session && buildInjectedSessionScript(session);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, width, height }}
      >
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="flex-1 text-base font-semibold text-foreground">
            Bud por voz
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar conversa por voz"
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
          >
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: chatUrl }}
          style={{ flex: 1, backgroundColor: colors.background }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          mixedContentMode="always"
          sharedCookiesEnabled
          startInLoadingState
          injectedJavaScriptBeforeContentLoaded={injectedBeforeContent || undefined}
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-background">
              <ActivityIndicator size="large" color={colors.foreground} />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('Voice WebView error', nativeEvent);
          }}
        />
      </View>
    </Modal>
  );
}
