import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/styles';
import type { NavigationProp } from '@/types/navigation';
import {
  createSupportFeedbackStyles,
  DARK_COLORS,
  LIGHT_COLORS,
} from '@/pages/SupportFeedback.styles';

export default function SupportFeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useAppAlert();
  const { mode } = useTheme();

  const colors = useMemo(() => (mode === 'dark' ? DARK_COLORS : LIGHT_COLORS), [mode]);
  const styles = useMemo(() => createSupportFeedbackStyles(colors), [colors]);

  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => {
    if (sending) return false;
    if (reason.trim().length === 0) return false;
    if (message.trim().length === 0) return false;
    if (reason.length > 120) return false;
    if (message.length > 1000) return false;
    return true;
  }, [message, reason, sending]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) return navigation.goBack();
    return navigation.navigate('Settings');
  }, [navigation]);

  const handleSend = useCallback(async () => {
    const trimmedReason = reason.trim();
    const trimmedMessage = message.trim();

    if (trimmedReason.length === 0 || trimmedMessage.length === 0) {
      showAlert({ title: 'Atenção', message: 'Preencha o motivo e a mensagem.' });
      return;
    }

    if (trimmedReason.length > 120) {
      showAlert({ title: 'Atenção', message: 'O motivo deve ter no máximo 120 caracteres.' });
      return;
    }

    if (trimmedMessage.length > 1000) {
      showAlert({ title: 'Atenção', message: 'A mensagem deve ter no máximo 1000 caracteres.' });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          reason: trimmedReason,
          message: trimmedMessage,
          userEmail: user?.email ?? 'email@desconhecido.com',
        },
      });

      if (error) throw error;

      showAlert({
        title: 'Enviado',
        message: 'Sua mensagem foi enviada com sucesso!',
        buttons: [{ text: 'OK', onPress: handleBack }],
      });
      setReason('');
      setMessage('');
    } catch (error: unknown) {
      console.error('Error sending support email:', error);
      showAlert({
        title: 'Erro',
        message: 'Não foi possível enviar sua mensagem. Tente novamente.',
      });
    } finally {
      setSending(false);
    }
  }, [handleBack, message, reason, showAlert, user?.email]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(insets.bottom, 0) + Spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.75}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Suporte e Feedback</Text>
          <Text style={styles.subtitle}>
            Adoraríamos saber suas ideias sobre como melhorar o Bud ou saber com o que você precisa de
            ajuda. Envie uma mensagem diretamente para a nossa equipe.
          </Text>

          <Text style={styles.label}>Motivo da solicitação</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder=""
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={120}
              accessibilityLabel="Motivo da solicitação"
            />
          </View>

          <Text style={styles.messageLabel}>Mensagem</Text>
          <View style={[styles.inputContainer, styles.textareaContainer]}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder=""
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              accessibilityLabel="Mensagem"
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
          >
            <Text style={styles.sendButtonText}>{sending ? 'Enviando…' : 'Enviar'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
