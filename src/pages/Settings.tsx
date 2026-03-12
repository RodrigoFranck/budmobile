import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { ChevronRight, MessageCircle, X } from "lucide-react-native";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
import type { NavigationProp } from "@/types/navigation";
import { Typography, Spacing, IconSize } from "@/constants/styles";
import { LayoutSpacing } from "@/constants/layout";
import { BUDMIND_PRICING_URL } from "@/constants/preferences";
import type { PlanId } from "@/hooks/useUserPlan";

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  reflexivo: "Reflexivo",
  profundo: "Profundo",
};

function PreferenceRow({
  onPress,
  left,
  right,
}: {
  onPress?: () => void;
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  const content = (
    <View
      className="w-full rounded-xl bg-card p-4 flex-row items-center justify-between"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    >
      {left}
      {right}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const { user, signOut } = useAuth();
  const { effectivePlan } = useUserPlan();
  const planLabel = PLAN_LABELS[effectivePlan] ?? effectivePlan;

  const [darkMode, setDarkMode] = useState(false);
  const [darkModeLoading, setDarkModeLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setDarkModeLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("dark_mode")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setDarkMode(Boolean(data.dark_mode));
      }
      if (!cancelled) setDarkModeLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleToggleDarkMode = useCallback(
    async (value: boolean) => {
      setDarkMode(value);
      if (!user?.id) return;
      await supabase
        .from("profiles")
        .update({ dark_mode: value })
        .eq("id", user.id);
    },
    [user?.id],
  );

  const openPricing = useCallback(() => {
    WebBrowser.openBrowserAsync(BUDMIND_PRICING_URL);
  }, []);

  const openAboutOrPlaceholder = useCallback(() => {
    Alert.alert(
      "Sobre mim",
      "Em breve no app. Use o Bud no navegador para editar seu perfil.",
      [{ text: "OK" }],
    );
  }, []);

  const openSupportOrPlaceholder = useCallback(() => {
    Alert.alert(
      "Suporte",
      "Em breve: envio de mensagem pelo app. Por enquanto, use o suporte pelo site.",
      [{ text: "OK" }],
    );
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  }, [signOut]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  }, [navigation]);

  return (
    <View className="flex-1 bg-background">
      <Header />
      <Sidebar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: headerHeight + LayoutSpacing.contentPadding.top,
          paddingHorizontal: LayoutSpacing.contentPadding.horizontal,
          paddingBottom: LayoutSpacing.contentPadding.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-foreground font-semibold px-2 pb-4 pt-2"
          style={{ fontSize: Typography["2xl"] }}
        >
          Preferências
        </Text>

        <View style={{ gap: Spacing.base }}>
          <PreferenceRow
            onPress={openAboutOrPlaceholder}
            left={
              <Text
                className="text-foreground"
                style={{ fontSize: Typography.base }}
              >
                Sobre mim
              </Text>
            }
            right={<ChevronRight size={IconSize.md} color="#9ca3af" />}
          />

          <PreferenceRow
            onPress={openPricing}
            left={
              <Text
                className="text-foreground"
                style={{ fontSize: Typography.base }}
              >
                Meu Plano
              </Text>
            }
            right={
              <View
                className="flex-row items-center"
                style={{ gap: Spacing.sm }}
              >
                <Text
                  className="text-muted-foreground"
                  style={{ fontSize: Typography.sm }}
                >
                  {planLabel}
                </Text>
                <ChevronRight size={IconSize.md} color="#9ca3af" />
              </View>
            }
          />

          <PreferenceRow
            left={
              <Text
                className="text-foreground"
                style={{ fontSize: Typography.base }}
              >
                Modo escuro
              </Text>
            }
            right={
              darkModeLoading ? (
                <ActivityIndicator size="small" color="#9ca3af" />
              ) : (
                <Switch
                  value={darkMode}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: "#374151", true: "#6b7280" }}
                  thumbColor="#fff"
                />
              )
            }
          />

          <PreferenceRow
            onPress={openSupportOrPlaceholder}
            left={
              <View
                className="flex-row items-center"
                style={{ gap: Spacing.md }}
              >
                <MessageCircle size={IconSize.md} color="#9ca3af" />
                <Text
                  className="text-foreground"
                  style={{ fontSize: Typography.base }}
                >
                  Suporte
                </Text>
              </View>
            }
            right={<ChevronRight size={IconSize.md} color="#9ca3af" />}
          />
        </View>

        <View style={{ marginTop: Spacing.xl }}>
          <Button
            variant="destructive"
            className="w-full rounded-xl h-14 bg-destructive/20"
            onPress={handleSignOut}
          >
            <Text
              className="text-destructive font-medium"
              style={{ fontSize: Typography.base }}
            >
              Sair
            </Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
