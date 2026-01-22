import { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation, NavigationContainerRef } from '@react-navigation/native';
import type { NavigationProp } from '@/types/navigation';
import { Typography, Spacing, InputHeight } from '@/constants/styles';
import { PlatformConstants, LayoutSpacing, SCREEN, ScreenBreakpoints } from '@/constants/layout';

const isSmallScreen = SCREEN.height < ScreenBreakpoints.small;

export default function AuthScreen() {
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const handleForgotPassword = () => {
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate('ForgotPassword');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (awaitingVerification) return;

    if (!authLoading && user) {
      // Navigation will be handled by AppNavigator
    }
  }, [user, authLoading, awaitingVerification]);

  const handleLogin = async () => {
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      alert(`Erro ao fazer login: ${error.message}`);
      setIsLoading(false);
    } else {
      // Navigation handled by AppNavigator
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    setAwaitingVerification(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      alert(`Erro ao criar conta: ${error.message}`);
      setIsLoading(false);
      setAwaitingVerification(false);
      return;
    }

    // Get the user ID from the session after signup
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      alert('Não foi possível obter o ID do usuário.');
      setIsLoading(false);
      setAwaitingVerification(false);
      return;
    }

    // Send verification email
    try {
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const baseUrl = SUPABASE_URL.replace('/rest/v1', '');

      await supabase.functions.invoke('send-auth-email', {
        body: {
          email: signupEmail,
          type: 'email_confirmation',
          name: signupName,
          userId: userId,
          redirectTo: baseUrl,
        },
      });
    } catch (emailErr) {
      console.error('Error invoking send-auth-email:', emailErr);
    }

    setIsLoading(false);
    alert('Conta criada! Verifique seu email para confirmar.');
  };

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Carregando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={PlatformConstants.keyboardBehavior}
      className="flex-1 bg-background"
      keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: LayoutSpacing.authPadding.horizontal,
          paddingVertical: PlatformConstants.isIOS 
            ? LayoutSpacing.authPadding.vertical.ios 
            : LayoutSpacing.authPadding.vertical.android,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Header */}
          <View style={{ marginBottom: Spacing['2xl'] }}>
            <Text 
              className="text-4xl font-bold text-foreground text-center" 
              style={{ marginBottom: Spacing.md, fontSize: Typography['4xl'] }}
            >
              Bem-vindo
            </Text>
            <Text 
              className="text-lg text-muted-foreground text-center" 
              style={{ fontSize: Typography.lg }}
            >
              Faca login ou crie sua conta para continuar
            </Text>
          </View>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <View style={{ gap: Spacing.lg }}>
                <View style={{ gap: Spacing.md }}>
                  <Label 
                    className="text-foreground" 
                    style={{ fontSize: Typography.base, marginBottom: Spacing.sm }}
                  >
                    Email
                  </Label>
                  <Input
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ gap: 12 }}>
                  <View className="flex-row items-center justify-between">
                    <Label className="text-foreground" style={{ fontSize: 16 }}>Senha</Label>
                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      activeOpacity={0.7}
                    >
                      <Text className="text-primary" style={{ fontSize: 15 }}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    placeholder="********"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ marginTop: Spacing.sm }}>
                  <Button 
                    onPress={handleLogin} 
                    disabled={isLoading} 
                    loading={isLoading} 
                    className="w-full" 
                    style={{ height: InputHeight.lg }}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </View>
              </View>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <View style={{ gap: Spacing.lg }}>
                <View style={{ gap: Spacing.md }}>
                  <Label 
                    className="text-foreground" 
                    style={{ fontSize: Typography.base, marginBottom: Spacing.sm }}
                  >
                    Nome
                  </Label>
                  <Input
                    placeholder="Seu nome"
                    value={signupName}
                    onChangeText={setSignupName}
                    maxLength={100}
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ gap: 12 }}>
                  <Label className="text-foreground" style={{ fontSize: 16, marginBottom: 8 }}>Email</Label>
                  <Input
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={255}
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ gap: 12 }}>
                  <Label className="text-foreground" style={{ fontSize: 16, marginBottom: 8 }}>Senha</Label>
                  <Input
                    placeholder="********"
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    secureTextEntry
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ gap: 12 }}>
                  <Label className="text-foreground" style={{ fontSize: 16, marginBottom: 8 }}>Confirmar Senha</Label>
                  <Input
                    placeholder="********"
                    value={signupConfirmPassword}
                    onChangeText={setSignupConfirmPassword}
                    secureTextEntry
                    editable={!isLoading}
                    style={{ height: InputHeight.lg, fontSize: Typography.base }}
                  />
                </View>
                <View style={{ marginTop: 8 }}>
                  <Button onPress={handleSignup} disabled={isLoading} loading={isLoading} className="w-full" style={{ height: 52 }}>
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </View>
              </View>
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
