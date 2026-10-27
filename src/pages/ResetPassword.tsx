import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppAlert } from "@/contexts/AppAlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlatformConstants } from "@/constants/layout";
import { createAuthStyles } from "@/pages/Auth/Auth.styles";
import { useV3Colors } from "@/theme";
import {
  mapPasswordUpdateError,
  passwordMismatchAlert,
  passwordTooShortAlert,
  passwordUpdatedAlert,
} from "@/utils/auth/authMessages";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colors = useV3Colors();
  const styles = createAuthStyles(colors);
  const { showAlert } = useAppAlert();
  const { clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      showAlert(passwordTooShortAlert(MIN_PASSWORD_LENGTH));
      return;
    }

    if (password !== confirmPassword) {
      showAlert(passwordMismatchAlert());
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showAlert(mapPasswordUpdateError(error.message));
        return;
      }

      clearPasswordRecovery();
      await signOut();
      showAlert(passwordUpdatedAlert());
    } finally {
      setIsLoading(false);
    }
  };

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
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.forgotPasswordContent}>
            <View style={styles.forgotPasswordBody}>
              <Text style={styles.forgotPasswordTitle}>Nova senha</Text>
              <Text style={styles.forgotPasswordDescription}>
                Escolha uma nova senha para a sua conta Bud.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nova senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={colors.text3}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repita a nova senha"
                    placeholderTextColor={colors.text3}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
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
                    <ActivityIndicator size="small" color={colors.onBtn} />
                  ) : (
                    <Text style={styles.buttonText}>Salvar nova senha</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
