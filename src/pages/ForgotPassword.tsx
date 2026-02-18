import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const horizontalPadding = SCREEN_WIDTH * 0.08; // 8% da largura da tela

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const baseUrl = SUPABASE_URL.replace('/rest/v1', '');

      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          type: 'password_reset',
          email: email,
          redirectUrl: `${baseUrl}/reset-password`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      setIsEmailSent(true);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      alert(`Erro ao enviar email: ${error.message || 'Ocorreu um erro. Verifique o email e tente novamente.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: Platform.OS === 'ios' ? 40 : 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ minHeight: SCREEN_HEIGHT * 0.85 }}>
            <View className="mb-8">
              <Text className="text-2xl font-bold text-foreground text-center mb-2">
                Verifique seu Email
              </Text>
              <Text className="text-base text-muted-foreground text-center">
                Enviamos um link de recuperação para{' '}
                <Text className="font-semibold text-foreground">{email}</Text>. 
                Clique no link para criar uma nova senha.
              </Text>
            </View>

            <View className="space-y-4">
              <Text className="text-sm text-muted-foreground text-center mb-4">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </Text>
              <Button
                variant="outline"
                onPress={() => setIsEmailSent(false)}
                className="w-full"
              >
                Tentar novamente
              </Button>
              <Button
                variant="ghost"
                onPress={() => navigation.goBack()}
                className="w-full"
              >
                Voltar para Login
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: horizontalPadding,
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: SCREEN_HEIGHT * 0.85 }}>
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              Esqueceu sua senha?
            </Text>
            <Text className="text-base text-muted-foreground text-center">
              Digite seu email e enviarei um link para redefinir sua senha
            </Text>
          </View>

          <View className="space-y-4">
            <View className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={{ marginTop: 24 }}>
              <Button
                onPress={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>
            </View>
            <Button
              variant="ghost"
              onPress={() => navigation.goBack()}
              className="w-full"
            >
              Voltar para Login
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
