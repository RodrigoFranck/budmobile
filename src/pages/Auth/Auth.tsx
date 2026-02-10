import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  KeyboardAvoidingView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { PlatformConstants } from '@/constants/layout';
import { authStyles as styles } from './Auth.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

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

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      alert('Não foi possível obter o ID do usuário.');
      setIsLoading(false);
      setAwaitingVerification(false);
      return;
    }

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={PlatformConstants.keyboardBehavior}
      style={styles.container}
      keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Faça login ou crie sua conta para continuar
            </Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.tabActive]}
              onPress={() => setActiveTab('login')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
              onPress={() => setActiveTab('signup')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>
                Cadastro
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {activeTab === 'login' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#B5B5B5"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Senha</Text>
                  <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                    <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#B5B5B5"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#B5B5B5"
                  value={signupName}
                  onChangeText={setSignupName}
                  maxLength={100}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#B5B5B5"
                  value={signupEmail}
                  onChangeText={setSignupEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={255}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#B5B5B5"
                  value={signupPassword}
                  onChangeText={setSignupPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#B5B5B5"
                  value={signupConfirmPassword}
                  onChangeText={setSignupConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Criar conta</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
