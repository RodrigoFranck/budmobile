import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import { Spacing, Typography } from '@/constants/styles';
import type { NavigationProp } from '@/types/navigation';

const COLORS = {
  background: '#1D1916',
  card: '#373737',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  primary: '#BBEEEE',
  primaryText: '#1D1916',
  iconMuted: 'rgba(255,255,255,0.65)',
} as const;

export default function SupportFeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
      Alert.alert('Atenção', 'Preencha o motivo e a mensagem.');
      return;
    }

    if (trimmedReason.length > 120) {
      Alert.alert('Atenção', 'O motivo deve ter no máximo 120 caracteres.');
      return;
    }

    if (trimmedMessage.length > 1000) {
      Alert.alert('Atenção', 'A mensagem deve ter no máximo 1000 caracteres.');
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

      Alert.alert('Enviado', 'Sua mensagem foi enviada com sucesso!', [
        { text: 'OK', onPress: handleBack },
      ]);
      setReason('');
      setMessage('');
    } catch (error: unknown) {
      console.error('Error sending support email:', error);
      Alert.alert('Erro', 'Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  }, [handleBack, message, reason, user?.email]);

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
            <ArrowLeft size={20} color={COLORS.text} />
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
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              maxLength={120}
              accessibilityLabel="Motivo da solicitação"
            />
          </View>

          <Text style={[styles.label, { marginTop: Spacing.lg }]}>Mensagem</Text>
          <View style={[styles.inputContainer, styles.textareaContainer]}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder=""
              placeholderTextColor={COLORS.textMuted}
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
  },
  backButton: {
    marginTop: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: Spacing.lg,
    color: COLORS.text,
    fontSize: 28,
    fontFamily: 'InriaSerif-Regular',
  },
  subtitle: {
    marginTop: Spacing.md,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    marginTop: Spacing.xl,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  inputContainer: {
    marginTop: Spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  textareaContainer: {
    minHeight: 220,
  },
  textarea: {
    minHeight: 220,
  },
  sendButton: {
    marginTop: Spacing.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: COLORS.primaryText,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});

