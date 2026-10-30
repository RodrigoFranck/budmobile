import { Image, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, Clock, Mail, MessageSquare } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useAppAudience } from '@/hooks/useAppAudience';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { NOTIFICATION_ROWS } from '@/pages/menu/menuCatalog';
import { BudToggle, MenuHeader, PrefGroup, PrefRow, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Asset, useV3Colors } from '@/theme';

const ICONS: Record<(typeof NOTIFICATION_ROWS)[number]['icon'], LucideIcon> = {
  mail: Mail,
  clock: Clock,
  activity: Activity,
  message: MessageSquare,
};

export default function NotificationsScreen() {
  const colors = useV3Colors();
  const assets = useV3Asset();
  const navigation = useNavigation();
  const { values, persist } = useV3Preferences();
  const { setNotificationsEnabled } = useNotificationPreferences();
  const { can } = useAppAudience();
  const notifications = values.notifications;
  const rows = NOTIFICATION_ROWS.filter((row) => !row.capability || can(row.capability));

  const toggle = async (key: keyof typeof notifications, next: boolean) => {
    const updated = { ...notifications, [key]: next };
    await persist({ notifications: updated });
    const anyOn = Object.values(updated).some(Boolean);
    try {
      await setNotificationsEnabled(anyOn);
    } catch {
      // permission denied: keep local category state
    }
  };

  return (
    <ScreenScaffold>
      <MenuHeader title="Notificações" onBack={() => navigation.goBack()} />
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
                value={notifications[row.key]}
                onValueChange={(next) => void toggle(row.key, next)}
                accessibilityLabel={row.label}
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
