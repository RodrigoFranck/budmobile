import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Activity, Clock, Mail, MessageSquare } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { TOGGLE_SAVE_FAILED_MESSAGE } from '@/components/v3/BudToggle';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { useAppProfileQuery } from '@/hooks/useAppProfileQuery';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useV3Preferences, type NotificationPrefs } from '@/hooks/useV3Preferences';
import { NOTIFICATION_ROWS } from '@/pages/menu/menuCatalog';
import { BudToggle, MenuHeader, PrefGroup, PrefRow, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

const ICONS: Record<(typeof NOTIFICATION_ROWS)[number]['icon'], LucideIcon> = {
  mail: Mail,
  clock: Clock,
  activity: Activity,
  message: MessageSquare,
};

async function readOsPermissionGranted(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export default function NotificationsScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation();
  const { showAlert } = useAppAlert();
  const { values, persist } = useV3Preferences();
  const { data: profile } = useAppProfileQuery();
  const { setNotificationsEnabled } = useNotificationPreferences();
  const { can } = useAppAudience();
  const notifications = values.notifications;
  const [draft, setDraft] = useState<NotificationPrefs>(notifications);
  const draftRef = useRef(draft);
  const pendingSaves = useRef(0);
  draftRef.current = draft;
  const rows = NOTIFICATION_ROWS.filter((row) => !row.capability || can(row.capability));
  const [osGranted, setOsGranted] = useState(true);

  const refreshPermission = useCallback(async () => {
    const granted = await readOsPermissionGranted();
    setOsGranted(granted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermission();
      }
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const togglesDisabled = !osGranted;

  useEffect(() => {
    if (pendingSaves.current > 0) return;
    setDraft(notifications);
  }, [notifications]);

  const toggle = async (key: keyof NotificationPrefs, next: boolean) => {
    if (togglesDisabled || draftRef.current[key] === next) return;
    const previous = draftRef.current;
    const updated = { ...previous, [key]: next };
    draftRef.current = updated;
    pendingSaves.current += 1;
    setDraft(updated);
    let saved = false;
    try {
      const persisted = await persist({ notifications: updated });
      if (!persisted) throw new Error('save failed');
      saved = true;
      const anyOn = Object.values(updated).some(Boolean);
      const masterOn = profile?.push_notifications_enabled !== false;
      if (anyOn !== masterOn) {
        await setNotificationsEnabled(anyOn);
      }
    } catch {
      const rolledBack = { ...draftRef.current, [key]: previous[key] };
      draftRef.current = rolledBack;
      setDraft(rolledBack);
      if (saved) {
        try {
          await persist({ notifications: rolledBack });
        } catch {
          setDraft(rolledBack);
        }
      }
      showAlert({ title: TOGGLE_SAVE_FAILED_MESSAGE });
      void refreshPermission();
    } finally {
      pendingSaves.current -= 1;
    }
  };

  return (
    <ScreenScaffold>
      <MenuHeader title="Notificações" onBack={() => navigation.goBack()} />
      {!osGranted ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansSemi,
              fontSize: 15,
              lineHeight: 20,
              color: colors.text,
            }}
          >
            {Platform.OS === 'ios'
              ? 'As notificações estão desligadas no iPhone'
              : 'As notificações estão desligadas no aparelho'}
          </Text>
          <Pressable
            onPress={() => void Linking.openSettings()}
            accessibilityRole="button"
            accessibilityLabel="Abrir Ajustes"
            style={{
              marginTop: 12,
              alignSelf: 'flex-start',
              backgroundColor: colors.accent,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansSemi,
                fontSize: 14,
                lineHeight: 14,
                color: colors.onAccent,
              }}
            >
              Abrir Ajustes
            </Text>
          </Pressable>
        </View>
      ) : null}
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text2,
          marginTop: 16,
          paddingHorizontal: 4,
        }}
      >
        Escolha o que o Bud pode te lembrar. Nada de spam, prometemos.
      </Text>
      <PrefGroup style={{ marginTop: 20 }}>
        {rows.map((row, index) => (
          <PrefRow
            key={row.key}
            icon={ICONS[row.icon]}
            label={row.label}
            hint={row.hint}
            last={index === rows.length - 1}
            trailing={
              <BudToggle
                value={draft[row.key]}
                onValueChange={(next) => void toggle(row.key, next)}
                accessibilityLabel={row.label}
                disabled={togglesDisabled}
              />
            }
          />
        ))}
      </PrefGroup>
      <View style={{ alignItems: 'center', marginTop: 48 }}>
        <Image source={assets.notifBell} style={{ width: 120, height: 140 }} resizeMode="contain" />
      </View>
    </ScreenScaffold>
  );
}
