import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { PlatformConstants } from '@/constants/layout';
import { authStyles as styles } from './Auth.styles';
import { SITE_ORIGIN } from '@/constants/auth';

const backgroundLogin = require('@/assets/background-login.png');
const budLogo = require('@/assets/bud-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const { signUp, signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setIsLoadingLogin(true);
    try {
      const { error } = await signIn(loginEmail.trim(), loginPassword);
      if (error) {
        alert(`Erro ao fazer login: ${error.message}`);
        return;
      }
      // Sucesso: onAuthStateChange atualiza sessão; evita botão travado em loading
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    setIsLoadingSignup(true);
    setAwaitingVerification(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      alert(`Erro ao criar conta: ${error.message}`);
      setIsLoadingSignup(false);
      setAwaitingVerification(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      alert('Não foi possível obter o ID do usuário.');
      setIsLoadingSignup(false);
      setAwaitingVerification(false);
      return;
    }

    try {
      // email_confirmation monta link `${redirectTo}/verify?token=...` — precisa ser origem do site, não URL do Supabase
      const { error: fnError } = await supabase.functions.invoke('send-auth-email', {
        body: {
          email: signupEmail.trim(),
          type: 'email_confirmation',
          name: signupName,
          userId,
          redirectTo: SITE_ORIGIN,
        },
      });
      if (fnError) {
        console.error('send-auth-email error:', fnError);
      }
    } catch (emailErr) {
      console.error('Error invoking send-auth-email:', emailErr);
    }

    setIsLoadingSignup(false);
    alert('Conta criada! Verifique seu email para confirmar.');
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        alert(`Erro ao fazer login: ${error.message}`);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundLogin}
      style={styles.container}
      resizeMode="cover"
    >
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
              <Image 
                source={budLogo} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Você está no lugar certo.</Text>
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
                    editable={!isLoadingLogin}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Senha</Text>
                    <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                      <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="********"
                      placeholderTextColor="#B5B5B5"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      editable={!isLoadingLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={20} color="#666666" />
                      ) : (
                        <Eye size={20} color="#666666" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoadingLogin && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoadingLogin}
                  activeOpacity={0.7}
                >
                  {isLoadingLogin ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
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
                    editable={!isLoadingSignup}
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
                    editable={!isLoadingSignup}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="********"
                      placeholderTextColor="#B5B5B5"
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      secureTextEntry={!showSignupPassword}
                      editable={!isLoadingSignup}
                    />
                    <TouchableOpacity
                      onPress={() => setShowSignupPassword(!showSignupPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      {showSignupPassword ? (
                        <EyeOff size={20} color="#666666" />
                      ) : (
                        <Eye size={20} color="#666666" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Senha</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="********"
                      placeholderTextColor="#B5B5B5"
                      value={signupConfirmPassword}
                      onChangeText={setSignupConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoadingSignup}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#666666" />
                      ) : (
                        <Eye size={20} color="#666666" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoadingSignup && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={isLoadingSignup}
                  activeOpacity={0.7}
                >
                  {isLoadingSignup ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Criar conta</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={[styles.googleButton, isLoadingGoogle && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isLoadingGoogle || isLoadingLogin || isLoadingSignup}
              activeOpacity={0.7}
            >
              {isLoadingGoogle ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <View style={styles.googleIcon}>
                      <Text style={styles.googleIconText}>G</Text>
                    </View>
                  </View>
                  <Text style={styles.googleButtonText}>Continue com o Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Terms and Privacy */}
            <Text style={styles.termsText}>
              Ao se cadastrar e utilizar o Bud, você concorda com os{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://falecombud.com.br/terms')}
              >
                Termos de Serviço
              </Text>
              {' '}e{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://falecombud.com.br/privacy')}
              >
                Políticas de Privacidade
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
