import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppAlert } from "@/contexts/AppAlertContext";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_RESET_REDIRECT } from "@/constants/auth";
import { PlatformConstants } from "@/constants/layout";
import { authStyles as styles } from "@/pages/Auth/Auth.styles";
import {
  mapPasswordResetError,
  passwordResetEmptyEmailAlert,
} from "@/utils/auth/authMessages";

const backgroundLogin = require("@/assets/background-login.png");

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const alert = passwordResetEmptyEmailAlert();
      showAlert(alert);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: PASSWORD_RESET_REDIRECT,
      });

      if (error) {
        const alert = mapPasswordResetError(error.message);
        showAlert(alert);
        return;
      }

      setIsEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuccessBody = () => (
    <View style={styles.forgotPasswordBody}>
      <Text style={styles.forgotPasswordTitle}>Verifique seu email</Text>
      <Text style={styles.forgotPasswordDescription}>
        Enviamos um link de recuperação para{" "}
        <Text style={styles.emailHighlight}>{email}</Text>. Clique no link para
        criar uma nova senha.
      </Text>

      <Text style={[styles.forgotPasswordDescription, { marginBottom: 16 }]}>
        Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
      </Text>

      <TouchableOpacity
        style={styles.emailAuthToggle}
        onPress={() => setIsEmailSent(false)}
        activeOpacity={0.7}
      >
        <Text style={styles.emailAuthToggleText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormBody = () => (
    <View style={styles.forgotPasswordBody}>
      <Text style={styles.forgotPasswordTitle}>Esqueceu sua senha?</Text>
      <Text style={styles.forgotPasswordDescription}>
        Digite seu email e enviarei um link para redefinir sua senha
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#B5B5B5"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Enviar Link de Recuperação</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <View
          style={[
            styles.forgotPasswordNavBar,
            { paddingTop: insets.top + 8 },
          ]}
        >
          <TouchableOpacity
            style={[styles.backButton, { marginBottom: 0 }]}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color="#1E3A5F" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 0,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.forgotPasswordContent}>
            {isEmailSent ? renderSuccessBody() : renderFormBody()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
