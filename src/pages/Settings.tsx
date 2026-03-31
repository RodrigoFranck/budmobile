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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, ExternalLink, Link2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import type { NavigationProp } from "@/types/navigation";
import { Spacing, Typography } from "@/constants/styles";
import { BUDMIND_HELP_URL } from "@/constants/preferences";
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
  });

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshOnboardingStatus } = useAuth();
  const { mode, loaded: themeLoaded, setMode } = useTheme();
  const darkMode = mode === "dark";
  const darkModeLoading = !themeLoaded;
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const lightModeValue = useMemo(() => !darkMode, [darkMode]);
  const colors = useMemo(() => (darkMode ? DARK_COLORS : LIGHT_COLORS), [darkMode]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleToggleDarkMode = useCallback(
    async (isLightMode: boolean) => {
      const nextMode = isLightMode ? "light" : "dark";
      await setMode(nextMode);
    },
    [setMode],
  );

  const openHelp = useCallback(() => {
    WebBrowser.openBrowserAsync(BUDMIND_HELP_URL);
  }, []);

  const openSupportFeedback = useCallback(() => {
    navigation.navigate("SupportFeedback");
  }, [navigation]);

  const shareBud = useCallback(async () => {
    try {
      await Share.share({
        message: `Bud — ${BUDMIND_HELP_URL}`,
      });
    } catch (error: unknown) {
      console.error("Share error:", error);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  }, [signOut]);

  const handleResetOnboarding = useCallback(() => {
    if (!user?.id) {
      Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
      return;
    }

    Alert.alert("Rever onboarding", "Isso vai reabrir o onboarding ao finalizar. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Continuar",
        style: "default",
        onPress: async () => {
          setResettingOnboarding(true);
          try {
            const { error } = await supabase
              .from("profiles")
              .update({ onboarding_completed: false })
              .eq("id", user.id);

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
      },
    ]);
  }, [refreshOnboardingStatus, user?.id]);

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
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Sair"
        >
          <Text style={styles.rowText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
