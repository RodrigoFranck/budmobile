import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Apple, ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useAppAlert } from "@/contexts/AppAlertContext";
import { supabase } from "@/integrations/supabase/client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types/navigation";
import { PlatformConstants, SCREEN } from "@/constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authStyles as styles } from "./Auth.styles";
import { SITE_ORIGIN } from "@/constants/auth";
import {
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/constants/healthSafety";
import {
  mapLoginError,
  mapSignupError,
  signupIncompleteAlert,
  signupPasswordMismatchAlert,
  signupSuccessAlert,
} from "@/utils/auth/authMessages";
import { GoogleLogo } from "@/components/icons/GoogleLogo";

const backgroundLogin = require("@/assets/background-login.png");

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;
type AuthMethod = "social" | "email";
type EmailTab = "login" | "signup";

export default function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppAlert();
  const {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    isAppleSignInAvailable,
    user,
    loading: authLoading,
  } = useAuth();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("social");
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [activeTab, setActiveTab] = useState<EmailTab>("login");
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  useEffect(() => {
    if (awaitingVerification) return;
    if (!authLoading && user) {
      // Navigation will be handled by AppNavigator
    }
  }, [user, authLoading, awaitingVerification]);

  const showAuthAlert = ({ title, message }: { title: string; message: string }) => {
    showAlert({ title, message });
  };

  const handleLogin = async () => {
    setIsLoadingLogin(true);
    try {
      const { error } = await signIn(loginEmail.trim(), loginPassword);
      if (error) {
        showAuthAlert(mapLoginError(error.message));
        return;
      }
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      showAuthAlert(signupPasswordMismatchAlert());
      return;
    }

    setIsLoadingSignup(true);
    setAwaitingVerification(true);

    const trimmedEmail = signupEmail.trim();
    const { error, userId } = await signUp(trimmedEmail, signupPassword, signupName);

    if (error) {
      showAuthAlert(mapSignupError(error.message));
      setIsLoadingSignup(false);
      setAwaitingVerification(false);
      return;
    }

    if (!userId) {
      showAuthAlert(signupIncompleteAlert());
      setIsLoadingSignup(false);
      setAwaitingVerification(false);
      return;
    }

    void supabase.functions.invoke("send-auth-email", {
      body: {
        email: trimmedEmail,
        type: "email_confirmation",
        name: signupName,
        userId,
        redirectTo: SITE_ORIGIN,
      },
    });

    setIsLoadingSignup(false);
    showAuthAlert(signupSuccessAlert(trimmedEmail));
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        showAuthAlert(mapLoginError(error.message));
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const isSocialLoading = isLoadingGoogle || isLoadingApple;
  const isEmailLoading = isLoadingLogin || isLoadingSignup;
  const isAnyLoading = isSocialLoading || isEmailLoading;

  const handleAppleSignIn = async () => {
    if (isLoadingApple || isSocialLoading || isLoadingLogin || isLoadingSignup) {
      return;
    }

    setIsLoadingApple(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        showAuthAlert(mapLoginError(error.message));
      }
    } finally {
      setIsLoadingApple(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const showAppleButton = Platform.OS === "ios" && isAppleSignInAvailable;

  const renderSocialButtons = () => (
    <View style={styles.socialSection}>
      {showAppleButton && (
        <TouchableOpacity
          style={[
            styles.socialButton,
            styles.socialButtonApple,
            styles.socialButtonPrimary,
            isSocialLoading && styles.buttonDisabled,
          ]}
          onPress={handleAppleSignIn}
          disabled={isAnyLoading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Continuar com Apple"
        >
          {isLoadingApple ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.socialIconContainer}>
                <Apple size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text
                style={[styles.socialButtonText, styles.socialButtonTextApple]}
              >
                Continuar com Apple
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.socialButton,
          styles.socialButtonGoogle,
          styles.socialButtonPrimary,
          !showAppleButton && styles.socialButtonPrimaryFirst,
          isSocialLoading && styles.buttonDisabled,
        ]}
        onPress={handleGoogleSignIn}
        disabled={isAnyLoading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Continue com o Google"
      >
        {isLoadingGoogle ? (
          <ActivityIndicator size="small" color="rgba(0,0,0,0.54)" />
        ) : (
          <>
            <View style={styles.socialIconContainer}>
              <GoogleLogo size={24} />
            </View>
            <Text
              style={[styles.socialButtonText, styles.socialButtonTextGoogle]}
            >
              Continue com o Google
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLoginForm = () => (
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
          <ActivityIndicator size="small" color="#1D1916" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSignupForm = () => (
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

      <Text style={styles.signupHint}>
        Ao criar sua conta, enviaremos um e-mail de confirmação para você.
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoadingSignup && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={isLoadingSignup}
        activeOpacity={0.7}
      >
        {isLoadingSignup ? (
          <ActivityIndicator size="small" color="#1D1916" />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmailAuth = () => (
    <View style={styles.emailSection}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setAuthMethod("social")}
        disabled={isAnyLoading}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color="#FFFFFF" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "login" && styles.tabActive]}
          onPress={() => setActiveTab("login")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "login" && styles.tabTextActive,
            ]}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "signup" && styles.tabActive]}
          onPress={() => setActiveTab("signup")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "signup" && styles.tabTextActive,
            ]}
          >
            Cadastro
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "login" ? renderLoginForm() : renderSignupForm()}
    </View>
  );

  const topInset = 40;
  const bottomInset = 24;

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Image
        source={backgroundLogin}
        style={styles.backgroundImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <KeyboardAvoidingView
        behavior={PlatformConstants.keyboardBehavior}
        style={styles.container}
        keyboardVerticalOffset={PlatformConstants.keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: SCREEN.height,
              paddingTop: insets.top + topInset,
              paddingBottom: insets.bottom + bottomInset,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.content,
              {
                minHeight:
                  SCREEN.height -
                  insets.top -
                  topInset -
                  insets.bottom -
                  bottomInset,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.budWordmark} accessible={false}>
                Bud.
              </Text>
              <Text style={styles.subtitle}>Você está no lugar certo.</Text>
            </View>

            <View>
              <View style={styles.mainSection}>
                {authMethod === "social" ? (
                  <>
                    {renderSocialButtons()}

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>ou</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.emailAuthToggle}
                      onPress={() => setAuthMethod("email")}
                      disabled={isAnyLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emailAuthToggleText}>
                        Entrar ou criar conta com e-mail
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  renderEmailAuth()
                )}
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.termsText}>
                  Ao se cadastrar e utilizar o Bud, você concorda com os{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
                  >
                    Termos de Serviço
                  </Text>{" "}
                  e{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                  >
                    Políticas de Privacidade
                  </Text>
                  .
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
