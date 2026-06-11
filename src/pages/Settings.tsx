import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
  StyleSheet,
  Linking,
  Appearance,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, ExternalLink, Link2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useBudConfirmDialog } from "@/contexts/BudConfirmDialogContext";
import type { NavigationProp } from "@/types/navigation";
import { Spacing } from "@/constants/styles";
import { BUDMIND_HELP_URL, BUD_NATIVE_LINK_URL } from "@/constants/preferences";
import {
  HEALTH_DISCLAIMER,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from "@/constants/healthSafety";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

const DARK_COLORS = {
  background: "#1D1916",
  card: "#373737",
  cardBorder: "rgba(255,255,255,0.06)",
  text: "#FFFFFF",
  icon: "rgba(255,255,255,0.75)",
  primary: "#BBEEEE",
} as const;

const LIGHT_COLORS = {
  background: "#F7F1ED",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.08)",
  text: "#1D1916",
  icon: "rgba(29,25,22,0.65)",
  primary: "#2E7D7A",
} as const;

type Colors = {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  icon: string;
  primary: string;
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: Spacing.md,
      gap: Spacing.base,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        colors === DARK_COLORS ? "rgba(255,255,255,0.18)" : "rgba(29,25,22,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    row: {
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 18,
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowText: {
      color: colors.text,
      fontSize: 22,
      fontFamily: "InriaSerif-Regular",
    },
    rightSlot: {
      height: 56,
      justifyContent: "center",
      alignItems: "center",
    },
    switch: {
      transform: [{ translateY: -1 }],
    },
    footer: {
      marginTop: "auto",
      paddingTop: Spacing.xl,
      gap: Spacing.md,
      alignItems: "center",
    },
    footerDisclaimer: {
      color: colors.icon,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
    },
    footerLegal: {
      color: colors.icon,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    legalLink: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
    destructiveText: {
      color: "#E05252",
    },
  });

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount, refreshOnboardingStatus } = useAuth();
  const { confirm } = useBudConfirmDialog();
  const { mode, loaded: themeLoaded, setMode, setPreference } = useTheme();
  const darkMode = mode === "dark";
  const darkModeLoading = !themeLoaded;
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const lightModeValue = useMemo(() => !darkMode, [darkMode]);
  const colors = useMemo(() => (darkMode ? DARK_COLORS : LIGHT_COLORS), [darkMode]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleToggleDarkMode = useCallback(
    async (isLightMode: boolean) => {
      const nextMode = isLightMode ? "light" : "dark";
      const deviceMode = Appearance.getColorScheme() === "light" ? "light" : "dark";
      if (nextMode === deviceMode) {
        await setPreference("system");
        return;
      }
      await setMode(nextMode);
    },
    [setMode, setPreference],
  );

  const openHelp = useCallback(() => {
    WebBrowser.openBrowserAsync(BUDMIND_HELP_URL);
  }, []);

  const openSupportFeedback = useCallback(() => {
    navigation.navigate("SupportFeedback");
  }, [navigation]);

  const openCrisisResources = useCallback(() => {
    navigation.navigate("CrisisResources");
  }, [navigation]);

  const openPsychologicalAssessment = useCallback(() => {
    navigation.navigate("PsychologicalAssessment");
  }, [navigation]);

  const shareBud = useCallback(async () => {
    try {
      const message = `Conheça o Bud — a primeira IA de saúde mental do Brasil.\n\n${BUD_NATIVE_LINK_URL}`;
      await Share.share(
        Platform.OS === "ios"
          ? { message, url: BUD_NATIVE_LINK_URL, title: "Bud" }
          : { message, title: "Bud" },
      );
    } catch (error: unknown) {
      console.error("Share error:", error);
    }
  }, []);

  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL(PRIVACY_POLICY_URL);
  }, []);

  const openTerms = useCallback(() => {
    Linking.openURL(TERMS_OF_SERVICE_URL);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    confirm({
      title: "Excluir conta",
      message:
        "Esta ação é permanente. Todos os seus dados, conversas e preferências serão removidos e não poderão ser recuperados.",
      confirmLabel: "Excluir conta",
      destructive: true,
      onConfirm: async () => {
        setDeletingAccount(true);
        try {
          const { error } = await deleteAccount();
          if (error) {
            Alert.alert("Erro", error.message);
          }
        } finally {
          setDeletingAccount(false);
        }
      },
    });
  }, [confirm, deleteAccount]);

  const handleSignOut = useCallback(() => {
    confirm({
      title: "Sair",
      message: "Deseja sair da sua conta?",
      confirmLabel: "Sair",
      destructive: true,
      onConfirm: () => signOut(),
    });
  }, [confirm, signOut]);

  const handleResetOnboarding = useCallback(() => {
    if (!user?.id) {
      Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
      return;
    }

    confirm({
      title: "Rever onboarding",
      message: "Isso vai reabrir o onboarding ao finalizar. Continuar?",
      confirmLabel: "Continuar",
      onConfirm: async () => {
        setResettingOnboarding(true);
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ onboarding_completed: false })
            .eq("user_id", user.id);

          if (error) {
            Alert.alert("Erro", error.message);
            return;
          }

          await refreshOnboardingStatus();
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Erro desconhecido";
          Alert.alert("Erro", message);
        } finally {
          setResettingOnboarding(false);
        }
      },
    });
  }, [confirm, refreshOnboardingStatus, user?.id]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs");
    }
  }, [navigation]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.75}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openHelp}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Encontrar ajuda"
        >
          <Text style={styles.rowText}>Encontrar ajuda</Text>
          <ExternalLink size={20} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openCrisisResources}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Recursos de crise"
        >
          <Text style={styles.rowText}>Recursos de crise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openPsychologicalAssessment}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Avaliação psicológica"
        >
          <Text style={styles.rowText}>Avaliação psicológica</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.rowText}>Modo claro</Text>
          <View style={styles.rightSlot}>
            {darkModeLoading ? (
              <ActivityIndicator size="small" color={colors.icon} />
            ) : (
              <Switch
                value={lightModeValue}
                onValueChange={handleToggleDarkMode}
                trackColor={{
                  false: colors === DARK_COLORS ? "rgba(255,255,255,0.25)" : "rgba(29,25,22,0.18)",
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                style={styles.switch}
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={openSupportFeedback}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Suporte e Feedback"
        >
          <Text style={styles.rowText}>Suporte e Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareBud}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Compartilhar Bud"
        >
          <Text style={styles.rowText}>Compartilhar Bud</Text>
          <Link2 size={20} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResetOnboarding}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Rever onboarding"
          disabled={resettingOnboarding}
        >
          <Text style={styles.rowText}>
            {resettingOnboarding ? "Reabrindo onboarding..." : "Rever onboarding"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Excluir conta"
          disabled={deletingAccount}
        >
          <Text style={[styles.rowText, styles.destructiveText]}>
            {deletingAccount ? "Excluindo conta..." : "Excluir conta"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Sair"
        >
          <Text style={styles.rowText}>Sair</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerDisclaimer}>{HEALTH_DISCLAIMER}</Text>
          <Text style={styles.footerLegal}>
            <Text style={styles.legalLink} onPress={openTerms}>
              Termos de Serviço
            </Text>
            {" · "}
            <Text style={styles.legalLink} onPress={openPrivacyPolicy}>
              Política de Privacidade
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
