import { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useAppAlert } from "@/contexts/AppAlertContext";
import { supabase } from "@/integrations/supabase/client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types/navigation";
import { PlatformConstants, SCREEN } from "@/constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAuthStyles } from "./Auth.styles";
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
import { AppleLogo } from "@/components/icons/AppleLogo";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import { BudButton } from "@/components/v3";
import { useV3Colors } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;
type EmailTab = "login" | "signup";

export default function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useV3Colors();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
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
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [activeTab, setActiveTab] = useState<EmailTab>("login");
  const [awaitingVerification, setAwaitingVerification] = useState(false);

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
          style={[styles.socialButton, isSocialLoading && styles.buttonDisabled]}
          onPress={handleAppleSignIn}
          disabled={isAnyLoading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Continuar com Apple"
        >
          {isLoadingApple ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <View style={styles.socialIconContainer}>
                <AppleLogo color={colors.text} />
              </View>
              <Text style={styles.socialButtonText}>Continuar com Apple</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.socialButton, isSocialLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={isAnyLoading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Continuar com Google"
      >
        {isLoadingGoogle ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <View style={styles.socialIconContainer}>
              <GoogleLogo />
            </View>
            <Text style={styles.socialButtonText}>Continuar com Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLoginForm = () => (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="seu@email.com"
        placeholderTextColor={colors.text3}
        value={loginEmail}
        onChangeText={setLoginEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoadingLogin}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={colors.text3}
        value={loginPassword}
        onChangeText={setLoginPassword}
        secureTextEntry
        editable={!isLoadingLogin}
      />
      <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={styles.labelRow}>
        <Text style={styles.forgotPassword}>Esqueci a senha</Text>
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
          placeholderTextColor={colors.text3}
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
          placeholderTextColor={colors.text3}
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
            placeholderTextColor={colors.text3}
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
              <EyeOff size={20} color={colors.text2} />
            ) : (
              <Eye size={20} color={colors.text2} />
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
            placeholderTextColor={colors.text3}
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
              <EyeOff size={20} color={colors.text2} />
            ) : (
              <Eye size={20} color={colors.text2} />
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
          <ActivityIndicator size="small" color={colors.onBtn} />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAuth = () => (
    <View
      style={[
        styles.content,
        {
          minHeight: SCREEN.height - insets.top - 24 - insets.bottom - 16,
        },
      ]}
    >
      <View style={styles.loginBody}>
        <View style={styles.loginTitleBlock}>
          <Text style={styles.title}>
            Que bom ter você <Text style={styles.titleAccent}>aqui</Text>
          </Text>
          <Text style={styles.subtitle}>
            Entre para continuar de onde parou. Suas conversas são só suas.
          </Text>
        </View>
        <View style={styles.authFormStack}>
          {renderSocialButtons()}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>
          {activeTab === "signup" ? renderSignupForm() : renderLoginForm()}
        </View>
      </View>
      <View style={styles.footerSection}>
        {activeTab === "login" ? (
          <BudButton
            label="Entrar"
            loading={isLoadingLogin}
            disabled={isLoadingLogin}
            onPress={() => void handleLogin()}
          />
        ) : null}
        <TouchableOpacity
          style={styles.secondaryLink}
          onPress={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
          accessibilityRole="button"
          accessibilityLabel={
            activeTab === "login" ? "Criar conta com e-mail" : "Já tenho conta"
          }
        >
          <Text style={styles.secondaryLinkText}>
            {activeTab === "login" ? "Criar conta com e-mail" : "Já tenho conta"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          Ao continuar, você aceita os{" "}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          >
            Termos de uso
          </Text>{" "}
          e a{" "}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            Política de Privacidade
          </Text>
          .
        </Text>
      </View>
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderAuth()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
