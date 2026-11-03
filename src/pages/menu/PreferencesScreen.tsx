import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Linking, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import {
  Bell,
  Heart,
  Leaf,
  Lock,
  Mic,
  Sun,
  User,
  Volume2,
} from 'lucide-react-native';

import { useAppLock } from '@/contexts/AppLockContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { formatPrefValue } from '@/pages/menu/menuCatalog';
import {
  BudToggle,
  MenuHeader,
  PrefGroup,
  PrefRow,
  ScreenScaffold,
  SectionLabel,
} from '@/pages/menu/menuUi';
import { fonts, motion, useV3Asset, useV3Colors, voiceFromValue, voiceOptions } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

export default function PreferencesScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { mode, setMode } = useTheme();
  const { values, profileIncomplete, persist } = useV3Preferences();
  const { enabled: appLockEnabled, busy: appLockBusy, setEnabled: setAppLockEnabled } = useAppLock();
  const [micLabel, setMicLabel] = useState('Permitido');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [themeLight, setThemeLight] = useState(mode === 'light');
  const themeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceLabel =
    voiceOptions.find((option) => option.id === voiceFromValue(values.voice))?.label ?? 'Kaique';
  const interestsLabel = formatPrefValue(values.interests, values.gender);
  const motivesLabel = profileIncomplete ? 'Não respondido' : 'Suas respostas do começo';

  useEffect(() => {
    void Audio.getPermissionsAsync().then((status) => {
      setMicLabel(status.granted ? 'Permitido' : 'Não permitido');
    });
  }, []);

  useEffect(() => {
    setThemeLight(mode === 'light');
  }, [mode]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      sub.remove();
      if (themeTimer.current) clearTimeout(themeTimer.current);
    };
  }, []);

  const openMic = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const toggleTheme = useCallback(
    (nextLight: boolean) => {
      setThemeLight(nextLight);
      if (themeTimer.current) clearTimeout(themeTimer.current);
      const delay = reduceMotion ? 120 : motion.toggleMs;
      themeTimer.current = setTimeout(() => {
        void setMode(nextLight ? 'light' : 'dark');
      }, delay);
    },
    [reduceMotion, setMode],
  );

  const toggleAppLock = useCallback(
    (next: boolean) => {
      void (async () => {
        const ok = await setAppLockEnabled(next);
        if (ok) await persist({ appLock: next });
      })();
    },
    [persist, setAppLockEnabled],
  );

  return (
    <ScreenScaffold>
      <MenuHeader title="Preferências" onBack={() => navigation.goBack()} />
      {profileIncomplete ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            paddingHorizontal: 22,
            paddingVertical: 20,
            marginTop: 16,
            overflow: 'hidden',
            minHeight: 161,
          }}
        >
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 17, lineHeight: 17, color: colors.text }}>
            Complete seu perfil
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              lineHeight: 20,
              color: colors.text2,
              marginTop: 8,
              maxWidth: 230,
            }}
          >
            16 perguntas rápidas para o Bud te conhecer melhor.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Motives')}
            accessibilityRole="button"
            accessibilityLabel="Continuar · 4 min"
            style={{
              marginTop: 14,
              height: 42,
              width: 200,
              borderRadius: 29,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, color: colors.onAccent }}>
              Continuar · 4 min
            </Text>
          </Pressable>
          <Image
            source={assets.profileGiz}
            style={{ position: 'absolute', right: 6, top: 14, width: 110, height: 140 }}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <SectionLabel label="Sobre você" style={{ marginTop: profileIncomplete ? 18 : 16 }} />
      <PrefGroup style={{ marginTop: 10 }}>
        <PrefRow
          icon={User}
          label="Sobre mim"
          hint="Nome, idade, gênero e terapia"
          onPress={() => navigation.navigate('AboutMe')}
        />
        <PrefRow
          icon={Leaf}
          label="O que te trouxe aqui"
          hint={motivesLabel}
          last
          onPress={() => navigation.navigate('Motives')}
        />
      </PrefGroup>

      <SectionLabel label="Seu Bud" style={{ marginTop: 22 }} />
      <PrefGroup style={{ marginTop: 10 }}>
        <PrefRow
          icon={Volume2}
          label="Voz"
          value={voiceLabel}
          onPress={() => navigation.navigate('VoiceSelect')}
        />
        <PrefRow
          icon={Heart}
          label="Interesses"
          value={interestsLabel === 'Não respondido' ? undefined : interestsLabel}
          last
          onPress={() => navigation.navigate('PrefEdit', { field: 'interests' })}
        />
      </PrefGroup>

      <SectionLabel label="App" style={{ marginTop: 22 }} />
      <PrefGroup style={{ marginTop: 10 }}>
        <PrefRow
          icon={Sun}
          label="Tema claro"
          trailing={
            <BudToggle
              value={themeLight}
              onValueChange={toggleTheme}
              accessibilityLabel="Tema claro"
            />
          }
        />
        <PrefRow
          icon={Bell}
          label="Notificações"
          onPress={() => navigation.navigate('NotificationsPrefs')}
        />
        <PrefRow icon={Mic} label="Microfone" value={micLabel} onPress={openMic} />
        <PrefRow
          icon={Lock}
          label="Bloqueio do app"
          last
          trailing={
            <BudToggle
              value={appLockEnabled}
              disabled={appLockBusy}
              onValueChange={toggleAppLock}
              accessibilityLabel="Bloqueio do app"
            />
          }
        />
      </PrefGroup>
    </ScreenScaffold>
  );
}
